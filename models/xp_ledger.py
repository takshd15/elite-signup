from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, Text, DateTime, ForeignKey, Index, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql.expression import text

from models.base import Base
from models.user import AppUser
from models.user_challenge import UserChallenge

ALLOWED_REASON = ("verified_completion", "streak_bonus", "adjustment")


class XpLedger(Base):
    __tablename__ = "xp_ledger"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("public.users_auth.user_id", ondelete="CASCADE"),
        nullable=False,
    )

    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # 'verified_completion' | 'streak_bonus' | 'adjustment'

    # ✅ schema-qualified FK target; nullable + SET NULL matches DB intent
    ref_uc_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("challenges_schema.user_challenge.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
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
        {"schema": "challenges_schema"}
    )

    def __repr__(self) -> str:
        return f"<XpLedger id={self.id} user={self.user_id} delta={self.delta} reason={self.reason}>"
