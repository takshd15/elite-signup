from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Mapping

from sqlalchemy import text
from sqlalchemy.orm import Session


@dataclass
class VerificationCodeDTO:
    code: int
    user_id: int
    created_at: datetime | None
    expiration_date: datetime | None
    used: bool
    request_ip: str | None


def _tz_aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    # Make timestamps timezone-aware (UTC) if the DB returned naive datetimes
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def get_latest_code_for_user(db: Session, user_id: int) -> Optional[VerificationCodeDTO]:
    """
    Exact Python equivalent of Java's:
      SELECT * FROM auth_code_table
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1
    Returns a DTO or None if not found.
    """
    row: Mapping[str, Any] | None = db.execute(
        text("""
            SELECT code, user_id, created_at, expiration_date, used, request_ip
              FROM public.auth_code_table
             WHERE user_id = :uid
             ORDER BY created_at DESC
             LIMIT 1
        """),
        {"uid": user_id},
    ).mappings().first()

    if not row:
        return None

    return VerificationCodeDTO(
        code=int(row["code"]),
        user_id=int(row["user_id"]),
        created_at=_tz_aware(row["created_at"]),
        expiration_date=_tz_aware(row["expiration_date"]),
        used=bool(row["used"]),
        request_ip=row["request_ip"],
    )

def latest_code_is_valid_for_request(
    db: Session,
    user_id: int,
    request_ip: str,
    window_minutes: int = 15,
    require_used: bool = True,
) -> bool:
    """
    Returns True iff the most recent code for this user:
      - exists,
      - (optionally) is already marked used,
      - was created within `window_minutes`,
      - and came from the same `request_ip`.
    """
    vc = get_latest_code_for_user(db, user_id)
    if vc is None:
        return False

    if require_used and not vc.used:
        return False

    if not vc.created_at:
        return False

    now = datetime.now(timezone.utc)
    created = _tz_aware(vc.created_at)
    if created is None:
        return False

    not_expired = now <= (created + timedelta(minutes=window_minutes))
    ip_matches = (vc.request_ip == request_ip)

    return not_expired and ip_matches