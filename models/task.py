from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel
from sqlalchemy import String, Integer, Text, CheckConstraint, TIMESTAMP, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base

ALLOWED_URGENCY = ("low", "medium", "high")


class Task(Base):
    __tablename__ = "user_tasks"
    __table_args__ = (
        CheckConstraint("urgency in ('low','medium','high')", name="ck_task_urgency"),
        {"schema": "challenges_schema"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    title: Mapped[str] = mapped_column(String(140), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    urgency: Mapped[str] = mapped_column(String, nullable=False, default="medium")

    dueAt: Mapped[Optional[str]] = mapped_column(TIMESTAMP(timezone=True))
    createdAt: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    completedAt: Mapped[Optional[str]] = mapped_column(TIMESTAMP(timezone=True))

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("public.users_auth.user_id", ondelete="CASCADE"),
        nullable=False,
    )


    def __repr__(self) -> str:
        return (
            f"<Task id={self.id} title={self.title!r} urgency={self.urgency} "
            f"dueAt={self.dueAt} completedAt={self.completedAt}>"
        )

class TaskOut(BaseModel):
    id: int
    title: str
    notes: Optional[str] = None
    urgency: str
    dueAt: datetime
    createdAt: datetime
    completedAt: Optional[datetime] = None
    user_id: int