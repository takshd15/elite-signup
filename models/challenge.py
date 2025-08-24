from __future__ import annotations

from sqlalchemy import String, Integer, Boolean, Text, Index, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import ARRAY
from base import Base

ALLOWED_CADENCE = ("daily", "monthly")
ALLOWED_DIFFICULTY = ("easy", "medium", "hard")  # beta: 3 levels only

class Challenge(Base):
    __tablename__ = "challenges_schema.challenge"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Postgres arrays for lightweight tagging in beta
    goals: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    activities: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=[])

    cadence: Mapped[str] = mapped_column(String(16), nullable=False)     # 'daily' | 'monthly'
    difficulty: Mapped[str] = mapped_column(String(16), nullable=False)  # 'easy' | 'medium' | 'hard'
    est_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    base_xp: Mapped[int] = mapped_column(Integer, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    __table_args__ = (
        CheckConstraint(
            f"cadence IN ({', '.join(repr(c) for c in ALLOWED_CADENCE)})",
            name="challenge_cadence_check",
        ),
        CheckConstraint(
            f"difficulty IN ({', '.join(repr(d) for d in ALLOWED_DIFFICULTY)})",
            name="challenge_difficulty_check",
        ),
        CheckConstraint("est_minutes > 0", name="challenge_est_minutes_pos"),
        Index("ix_challenge_goals_gin", goals, postgresql_using="gin"),
        Index("ix_challenge_activities_gin", activities, postgresql_using="gin"),
        Index("ix_challenge_tags_gin", tags, postgresql_using="gin"),
    )

    def __repr__(self) -> str:
        return f"<Challenge id={self.id} title={self.title!r} cadence={self.cadence} diff={self.difficulty}>"
