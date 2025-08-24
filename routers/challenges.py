# app/routers/challenges.py
from __future__ import annotations

import hashlib
import hmac
import os
from datetime import date, datetime, timedelta
from typing import Optional, List

import requests
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from fastapi import Body
from pydantic import BaseModel, HttpUrl
from sqlalchemy import func, and_, or_, select, update, delete
from sqlalchemy.orm import Session, joinedload

from db import get_session  # your dependency that returns a sync Session
from models.challenge import Challenge
from models.user import AppUser
from models.user_challenge import UserChallenge
from models.xp_ledger import XpLedger
from models.pack import DailyPack, DailyPackItem, MonthlyPack, MonthlyPackItem

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGO = os.getenv("JWT_ALGO", "HS256")

DAILY_PACK_SIZE = int(os.getenv("DAILY_PACK_SIZE", "3"))
MONTHLY_PACK_SIZE = int(os.getenv("MONTHLY_PACK_SIZE", "3"))
# ---------- date helpers ----------
def today_utc() -> date:
    return datetime.utcnow().date()


def month_bounds(d: date) -> tuple[date, date]:
    start = d.replace(day=1)
    # next month first day:
    if start.month == 12:
        next_first = date(start.year + 1, 1, 1)
    else:
        next_first = date(start.year, start.month + 1, 1)
    end = next_first - timedelta(days=1)
    return start, end


# ---------- schemas ----------
class UCOut(BaseModel):
    uc_id: int
    challenge_id: int
    title: str
    description: str
    goals: List[str]
    activities: List[str]
    tags: List[str]
    cadence: str
    difficulty: str
    est_minutes: int
    base_xp: int
    status: str
    progress_pct: int
    due_at: Optional[datetime]

    class Config:
        orm_mode = True


class VerifyTextIn(BaseModel):
    text: str


class VerifyLinkIn(BaseModel):
    url: HttpUrl


# ---------- verification utilities ----------
def _sign_attestation(user_id: str, challenge_id: int, uc_id: int, digest_hex: str) -> str:
    """
    Return a compact signature (HMAC) over the attestation fields.
    """
    msg = f"{user_id}|{challenge_id}|{uc_id}|{digest_hex}|{int(datetime.utcnow().timestamp())}".encode()
    sig = hmac.new(JWT_SECRET.encode(), msg, hashlib.sha256).hexdigest()
    return f"attest:{sig}"


def _finish_verify(db: Session, uc: UserChallenge, digest_hex: str, verifier: str, version: str = "v1") -> None:
    if uc.status == "verified":
        return  # idempotent
    uc.status = "verified"
    uc.verified_at = datetime.utcnow()
    uc.progress_pct = 100
    uc.submission_sha256 = digest_hex
    uc.verifier = verifier
    uc.verifier_version = version
    uc.proof_signature = _sign_attestation(str(uc.user_id), uc.challenge_id, uc.id, digest_hex)
    # award XP
    xp = XpLedger(
        user_id=uc.user_id,
        delta=uc.personalized_xp,
        reason="verified_completion",
        ref_uc_id=uc.id,
    )
    db.add(xp)
    db.flush()


def _verify_link(url: str) -> bool:
    try:
        # Fast and light: HEAD first, fallback to GET for providers that block HEAD
        r = requests.head(url, timeout=8, allow_redirects=True)
        if r.status_code >= 200 and r.status_code < 400:
            return True
        r = requests.get(url, timeout=10, allow_redirects=True)
        return 200 <= r.status_code < 400
    except Exception:
        return False


def _sha256_bytes(data: bytes) -> str:
    h = hashlib.sha256()
    h.update(data)
    return h.hexdigest()


# ---------- selection rater ----------
def _completed_challenge_ids(db: Session, user_id: str) -> set[int]:
    rows = (
        db.query(UserChallenge.challenge_id)
        .filter(UserChallenge.user_id == user_id, UserChallenge.status == "verified")
        .all()
    )
    return {r[0] for r in rows}


def _existing_pack_challenge_ids(db: Session, user_id: str, cadence: str, day: date) -> set[int]:
    if cadence == "daily":
        pack = (
            db.query(DailyPack)
            .options(joinedload(DailyPack.items))
            .filter(DailyPack.user_id == user_id, DailyPack.day == day)
            .first()
        )
        if not pack:
            return set()
        uc_ids = [it.user_challenge_id for it in pack.items]
    else:
        mstart, _ = month_bounds(day)
        pack = (
            db.query(MonthlyPack)
            .options(joinedload(MonthlyPack.items))
            .filter(MonthlyPack.user_id == user_id, MonthlyPack.month_start == mstart)
            .first()
        )
        if not pack:
            return set()
        uc_ids = [it.user_challenge_id for it in pack.items]

    if not uc_ids:
        return set()

    ch_ids = (
        db.query(UserChallenge.challenge_id)
        .filter(UserChallenge.id.in_(uc_ids))
        .all()
    )
    return {r[0] for r in ch_ids}


def _pick_challenges(db: Session, user_id: str, cadence: str, target_count: int, day: date) -> list[Challenge]:
    """Pick active challenges for cadence, excluding all historically verified + already in pack."""
    completed = _completed_challenge_ids(db, user_id)
    existing = _existing_pack_challenge_ids(db, user_id, cadence, day)

    q = (
        db.query(Challenge)
        .filter(
            Challenge.active.is_(True),
            Challenge.cadence == cadence,
            ~Challenge.id.in_(completed if completed else [-1]),
            ~Challenge.id.in_(existing if existing else [-1]),
        )
        .order_by(func.random())
        .limit(target_count)
    )
    return q.all()


def _ensure_daily_pack(db: Session, user_id: str, day: date, pack_size: int = DAILY_PACK_SIZE) -> DailyPack:
    pack = (
        db.query(DailyPack)
        .options(joinedload(DailyPack.items))
        .filter(DailyPack.user_id == user_id, DailyPack.day == day)
        .first()
    )
    if not pack:
        pack = DailyPack(user_id=user_id, day=day, title="Daily Pack")
        db.add(pack)
        db.flush()

    # fill pack to size with never-verified daily challenges
    current = len(pack.items or [])
    to_add = max(0, pack_size - current)
    if to_add > 0:
        candidates = _pick_challenges(db, user_id, "daily", to_add, day)
        position_base = current
        for i, ch in enumerate(candidates, start=1):
            # create UC row
            uc = UserChallenge(
                user_id=user_id,
                challenge_id=ch.id,
                period_start=day,
                period_end=day,
                status="assigned",
                progress_pct=0,
                personalized_xp=ch.base_xp,
                priority_score=None,
                reason_json=None,
                due_at=datetime.combine(day, datetime.max.time()).replace(tzinfo=None),
            )
            db.add(uc)
            db.flush()
            db.add(DailyPackItem(pack_id=pack.id, user_challenge_id=uc.id, position=position_base + i))
    return pack


def _ensure_monthly_pack(db: Session, user_id: str, ref_day: date, pack_size: int = MONTHLY_PACK_SIZE) -> MonthlyPack:
    mstart, mend = month_bounds(ref_day)
    pack = (
        db.query(MonthlyPack)
        .options(joinedload(MonthlyPack.items))
        .filter(MonthlyPack.user_id == user_id, MonthlyPack.month_start == mstart)
        .first()
    )
    if not pack:
        pack = MonthlyPack(user_id=user_id, month_start=mstart, title="Monthly Pack")
        db.add(pack)
        db.flush()

    current = len(pack.items or [])
    to_add = max(0, pack_size - current)
    if to_add > 0:
        candidates = _pick_challenges(db, user_id, "monthly", to_add, ref_day)
        position_base = current
        for i, ch in enumerate(candidates, start=1):
            uc = UserChallenge(
                user_id=user_id,
                challenge_id=ch.id,
                period_start=mstart,
                period_end=mend,
                status="assigned",
                progress_pct=0,
                personalized_xp=ch.base_xp,
                priority_score=None,
                reason_json=None,
                due_at=datetime.combine(mend, datetime.max.time()).replace(tzinfo=None),
            )
            db.add(uc)
            db.flush()
            db.add(MonthlyPackItem(pack_id=pack.id, user_challenge_id=uc.id, position=position_base + i))
    return pack


# ---------- endpoints ----------

@router.get("/get_daily", response_model=List[UCOut])
def get_daily_active(
    request: Request,
    db: Session = Depends(get_session),
):
    user_id = getattr(request.state, "user_id", None)  # set by middleware after JWT checks
    day = today_utc()
    pack = _ensure_daily_pack(db, user_id, day, DAILY_PACK_SIZE)
    db.commit()

    # load items joined with challenge
    uc_ids = [it.user_challenge_id for it in (pack.items or [])]
    if not uc_ids:
        return []

    rows = (
        db.query(UserChallenge, Challenge)
        .join(Challenge, Challenge.id == UserChallenge.challenge_id)
        .filter(UserChallenge.id.in_(uc_ids))
        .all()
    )
    out: List[UCOut] = []
    for uc, ch in rows:
        out.append(
            UCOut(
                uc_id=uc.id,
                challenge_id=ch.id,
                title=ch.title,
                description=ch.description,
                goals=ch.goals,
                activities=ch.activities,
                tags=ch.tags,
                cadence=ch.cadence,
                difficulty=ch.difficulty,
                est_minutes=ch.est_minutes,
                base_xp=ch.base_xp,
                status=uc.status,
                progress_pct=uc.progress_pct,
                due_at=uc.due_at,
            )
        )
    return out


@router.get("/get_monthly", response_model=List[UCOut])
def get_monthly_active(
    request: Request,
    db: Session = Depends(get_session),
):
    user_id = getattr(request.state, "user_id", None)  # set by middleware after JWT checks
    day = today_utc()
    pack = _ensure_monthly_pack(db, user_id, day, MONTHLY_PACK_SIZE)
    db.commit()

    uc_ids = [it.user_challenge_id for it in (pack.items or [])]
    if not uc_ids:
        return []

    rows = (
        db.query(UserChallenge, Challenge)
        .join(Challenge, Challenge.id == UserChallenge.challenge_id)
        .filter(UserChallenge.id.in_(uc_ids))
        .all()
    )
    out: List[UCOut] = []
    for uc, ch in rows:
        out.append(
            UCOut(
                uc_id=uc.id,
                challenge_id=ch.id,
                title=ch.title,
                description=ch.description,
                goals=ch.goals,
                activities=ch.activities,
                tags=ch.tags,
                cadence=ch.cadence,
                difficulty=ch.difficulty,
                est_minutes=ch.est_minutes,
                base_xp=ch.base_xp,
                status=uc.status,
                progress_pct=uc.progress_pct,
                due_at=uc.due_at,
            )
        )
    return out


# ---- verification endpoints ----
@router.post("/verify/text/{uc_id}")
def verify_text(
    uc_id: int,
    payload: VerifyTextIn,
    request: Request,
    db: Session = Depends(get_session),
):
    user_id = getattr(request.state, "user_id", None)  # set by middleware after JWT checks
    uc = (
        db.query(UserChallenge)
        .filter(UserChallenge.id == uc_id, UserChallenge.user_id == user_id)
        .first()
    )
    if not uc:
        raise HTTPException(status_code=404, detail="UserChallenge not found")

    text = payload.text.strip()
    if len(text) < 50:  # super lightweight guard
        raise HTTPException(status_code=400, detail="Reflection too short")

    digest = _sha256_bytes(text.encode("utf-8"))
    _finish_verify(db, uc, digest, verifier="text-log", version="v1")
    db.commit()
    return {"uc_id": uc_id, "verified": True}


@router.post("/verify/link/{uc_id}")
def verify_link(
    uc_id: int,
    payload: VerifyLinkIn,
    request: Request,
    db: Session = Depends(get_session),
):
    user_id = getattr(request.state, "user_id", None)  # set by middleware after JWT checks
    uc = (
        db.query(UserChallenge)
        .filter(UserChallenge.id == uc_id, UserChallenge.user_id == user_id)
        .first()
    )
    if not uc:
        raise HTTPException(status_code=404, detail="UserChallenge not found")

    ok = _verify_link(str(payload.url))
    if not ok:
        raise HTTPException(status_code=400, detail="URL not reachable (200–399 required)")

    digest = _sha256_bytes(str(payload.url).encode("utf-8"))
    _finish_verify(db, uc, digest, verifier="link-check", version="v1")
    db.commit()
    return {"uc_id": uc_id, "verified": True}


@router.post("/verify/photo/{uc_id}")
def verify_photo(
    request: Request,
    uc_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_session),
):
    """
    Lightweight: read bytes, hash; optional EXIF timestamp check (Pillow).
    """
    user_id = getattr(request.state, "user_id", None)  # set by middleware after JWT checks
    uc = (
        db.query(UserChallenge)
        .filter(UserChallenge.id == uc_id, UserChallenge.user_id == user_id)
        .first()
    )
    if not uc:
        raise HTTPException(status_code=404, detail="UserChallenge not found")

    content = file.file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    digest = _sha256_bytes(content)

    # Optional EXIF timestamp check (best-effort)
    try:
        from PIL import Image
        from PIL.ExifTags import TAGS

        file.file.seek(0)
        img = Image.open(file.file)
        exif = img.getexif()
        dt = None
        for tag_id, value in exif.items():
            tag = TAGS.get(tag_id, tag_id)
            if tag in ("DateTimeOriginal", "DateTime"):
                dt = value
                break
        # We just ignore if not present; you could parse and enforce month/day windows here.
    except Exception:
        pass

    _finish_verify(db, uc, digest, verifier="photo-proof", version="v1")
    db.commit()
    return {"uc_id": uc_id, "verified": True}


# ---- replace an assigned challenge with a new one (same cadence) ----
@router.post("/replace/{uc_id}", response_model=UCOut)
def replace_challenge(
    uc_id: int,
    request: Request,
    db: Session = Depends(get_session),
):
    user_id = getattr(request.state, "user_id", None)  # set by middleware after JWT checks
    uc = (
        db.query(UserChallenge)
        .options(joinedload(UserChallenge.challenge))
        .filter(UserChallenge.id == uc_id, UserChallenge.user_id == user_id)
        .first()
    )
    if not uc:
        raise HTTPException(status_code=404, detail="UserChallenge not found")
    if uc.status == "verified":
        raise HTTPException(status_code=400, detail="Cannot replace a verified challenge")

    cadence = uc.challenge.cadence

    # Mark old as skipped
    uc.status = "skipped"
    db.flush()

    # Pick a new challenge with same cadence not historically verified and not in current pack
    ref_day = uc.period_start
    candidates = _pick_challenges(db, user_id, cadence, 1, ref_day)
    if not candidates:
        raise HTTPException(status_code=409, detail="No replacement candidates available")

    ch = candidates[0]
    # Create new UC
    if cadence == "daily":
        p_start = p_end = ref_day
        due = datetime.combine(ref_day, datetime.max.time()).replace(tzinfo=None)
    else:
        mstart, mend = month_bounds(ref_day)
        p_start, p_end, due = mstart, mend, datetime.combine(mend, datetime.max.time()).replace(tzinfo=None)

    new_uc = UserChallenge(
        user_id=user_id,
        challenge_id=ch.id,
        period_start=p_start,
        period_end=p_end,
        status="assigned",
        progress_pct=0,
        personalized_xp=ch.base_xp,
        due_at=due,
    )
    db.add(new_uc)
    db.flush()

    # Replace in the pack item (keep same position)
    if cadence == "daily":
        item = (
            db.query(DailyPackItem)
            .join(DailyPack, DailyPack.id == DailyPackItem.pack_id)
            .filter(DailyPack.user_id == user_id, DailyPack.day == ref_day, DailyPackItem.user_challenge_id == uc_id)
            .first()
        )
        if item:
            item.user_challenge_id = new_uc.id
    else:
        mstart, _ = month_bounds(ref_day)
        item = (
            db.query(MonthlyPackItem)
            .join(MonthlyPack, MonthlyPack.id == MonthlyPackItem.pack_id)
            .filter(MonthlyPack.user_id == user_id, MonthlyPack.month_start == mstart, MonthlyPackItem.user_challenge_id == uc_id)
            .first()
        )
        if item:
            item.user_challenge_id = new_uc.id

    db.commit()

    # Response
    ch = db.query(Challenge).get(new_uc.challenge_id)
    return UCOut(
        uc_id=new_uc.id,
        challenge_id=ch.id,
        title=ch.title,
        description=ch.description,
        goals=ch.goals,
        activities=ch.activities,
        tags=ch.tags,
        cadence=ch.cadence,
        difficulty=ch.difficulty,
        est_minutes=ch.est_minutes,
        base_xp=ch.base_xp,
        status=new_uc.status,
        progress_pct=new_uc.progress_pct,
        due_at=new_uc.due_at,
    )


# ---- refresh services (can be hit by a cron/job) ----
@router.post("/refresh/daily")
def refresh_daily(
    request: Request,
    db: Session = Depends(get_session),
):
    user_id = getattr(request.state, "user_id", None)  # set by middleware after JWT checks
    pack = _ensure_daily_pack(db, user_id, today_utc(), DAILY_PACK_SIZE)
    db.commit()
    return {"ok": True, "pack_id": pack.id, "count": len(pack.items or [])}


@router.post("/refresh/monthly")
def refresh_monthly(
    request: Request,
    db: Session = Depends(get_session),
):
    user_id = getattr(request.state, "user_id", None)  # set by middleware after JWT checks
    pack = _ensure_monthly_pack(db, user_id, today_utc(), MONTHLY_PACK_SIZE)
    db.commit()
    return {"ok": True, "pack_id": pack.id, "count": len(pack.items or [])}
