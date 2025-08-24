from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Optional
from datetime import date, datetime

from sqlalchemy import (
    ForeignKey,
    Text,
    Integer,
    Date,
    DateTime,
    Numeric,
    CheckConstraint,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .user import AppUser
from .challenge import Challenge

ALLOWED_STATUS = ("assigned", "in_progress", "verified", "failed", "expired", "skipped")


class UserChallenge(Base):
    __tablename__ = "user_challenge"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # FK columns should store the scalar key values, not the related objects
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("app_user.id", ondelete="CASCADE"), nullable=False
    )
    challenge_id: Mapped[int] = mapped_column(
        ForeignKey("challenge.id", ondelete="RESTRICT"), nullable=False
    )

    period_start: Mapped[date] = mapped_column(Date, nullable=False)  # day start or 1st of month
    period_end:   Mapped[date] = mapped_column(Date, nullable=False)

    status: Mapped[str] = mapped_column(Text, nullable=False, default="assigned")
    progress_pct: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    personalized_xp: Mapped[int] = mapped_column(Integer, nullable=False)

    # Numeric maps best to Decimal in Python
    priority_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2))
    reason_json: Mapped[Optional[dict]] = mapped_column(JSONB)

    due_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Privacy-preserving attestation (no artifact retention)
    submission_sha256: Mapped[Optional[str]] = mapped_column(Text)   # 64 hex chars recommended
    verifier: Mapped[Optional[str]] = mapped_column(Text)            # e.g., 'repo-link', 'text-journal'
    verifier_version: Mapped[Optional[str]] = mapped_column(Text)    # e.g., 'v1'
    proof_signature: Mapped[Optional[str]] = mapped_column(Text)     # compact signed token/JWT

    # Relationships (keep simple backrefs if your other models already use them)
    user: Mapped[AppUser] = relationship(backref="user_challenges")
    challenge: Mapped[Challenge] = relationship(backref="user_challenges")

    __table_args__ = (
        UniqueConstraint("user_id", "challenge_id", "period_start", name="uq_user_challenge_period"),
        CheckConstraint("progress_pct BETWEEN 0 AND 100", name="uc_progress_range"),
        CheckConstraint(
            f"status IN ({', '.join(repr(s) for s in ALLOWED_STATUS)})",
            name="uc_status_check",
        ),
    )

    def __repr__(self) -> str:
        return f"<UserChallenge id={self.id} user={self.user_id} ch={self.challenge_id} status={self.status}>"
