from __future__ import annotations

import uuid
from typing import Optional
from datetime import datetime

from sqlalchemy import Integer, Text, DateTime, ForeignKey, Index, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base
from models.user import AppUser
from models.user_challenge import UserChallenge

ALLOWED_REASON = ("verified_completion", "streak_bonus", "adjustment")


class XpLedger(Base):
    __tablename__ = "challenges_schema.xp_ledger"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # FK columns should be scalar ids
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("public.users_auth.user_id", ondelete="CASCADE"),
        nullable=False,
    )

    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)

    ref_uc_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("user_challenge.id", ondelete="SET NULL")
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships (no back_populates required unless you add them on the other side)
    user: Mapped[AppUser] = relationship()
    user_challenge: Mapped[Optional[UserChallenge]] = relationship()

    __table_args__ = (
        CheckConstraint(
            f"reason IN ({', '.join(repr(r) for r in ALLOWED_REASON)})",
            name="xp_reason_check",
        ),
        Index("ix_xp_user_time", "user_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<XpLedger id={self.id} user={self.user_id} delta={self.delta} reason={self.reason}>"
