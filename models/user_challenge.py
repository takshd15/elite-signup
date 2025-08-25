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
    __table_args__ = (
        UniqueConstraint("user_id", "challenge_id", "period_start", name="uc_user_challenge_period_unique"),
        {"schema": "challenges_schema"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("public.users_auth.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    challenge_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("challenges_schema.challenge.id", ondelete="CASCADE"),
        nullable=False,
    )

    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    status: Mapped[str] = mapped_column(Text, nullable=False)  # enforce via app/DB check
    progress_pct: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    personalized_xp: Mapped[int] = mapped_column(Integer, nullable=False)

    submission_sha256: Mapped[Optional[str]] = mapped_column(Text)
    verifier: Mapped[Optional[str]] = mapped_column(Text)
    verifier_version: Mapped[Optional[str]] = mapped_column(Text)
    proof_signature: Mapped[Optional[str]] = mapped_column(Text)

    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    challenge: Mapped["Challenge"] = relationship(
        "Challenge",
        back_populates="user_challenges",
        foreign_keys=[challenge_id],
    )

    def __repr__(self) -> str:
        return f"<UserChallenge id={self.id} user={self.user_id} ch={self.challenge_id} status={self.status}>"
