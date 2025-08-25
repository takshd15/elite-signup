from __future__ import annotations

from typing import Optional, List

from sqlalchemy import String, Integer, Boolean, Text, Index, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ARRAY
from models.base import Base

ALLOWED_CADENCE = ("daily", "monthly")
ALLOWED_DIFFICULTY = ("easy", "medium", "hard")  # beta: 3 levels only


class Challenge(Base):
    __tablename__ = "challenge"
    __table_args__ = (
        CheckConstraint("cadence in ('daily','monthly')", name="ck_challenge_cadence"),
        CheckConstraint("difficulty in ('easy','medium','hard')", name="ck_challenge_difficulty"),
        {"schema": "challenges_schema"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)

    # enums enforced via DB check constraints above
    cadence: Mapped[str] = mapped_column(Text, nullable=False)      # 'daily' | 'monthly'
    difficulty: Mapped[str] = mapped_column(Text, nullable=False)   # 'easy' | 'medium' | 'hard'

    goals: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text), nullable=True)
    activities: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text), nullable=True)
    tags: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text), nullable=True)

    est_minutes: Mapped[Optional[int]] = mapped_column(Integer)
    base_xp: Mapped[int] = mapped_column(Integer, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # relationship to UserChallenge, in the same schema
    user_challenges: Mapped[list["UserChallenge"]] = relationship(
        "UserChallenge",
        back_populates="challenge",
        cascade="all, delete-orphan",
    )



    def __repr__(self) -> str:
        return f"<Challenge id={self.id} title={self.title!r} cadence={self.cadence} diff={self.difficulty}>"
