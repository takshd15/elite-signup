from __future__ import annotations

from typing import Optional

from sqlalchemy import Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base

# If your table is actually auth.user, change these two:
#   __tablename__ = "user"
#   __table_args__ = {"schema": "auth"}
class AppUser(Base):
    __tablename__ = "public.users_auth"

    # Keep attribute name `id` to avoid refactors; map it to the DB column `user_id` (INTEGER PK).
    id: Mapped[int] = mapped_column("user_id", Integer, primary_key=True)

    # Optional columns from users_auth; included for completeness/readability.
    username: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    role: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # If other code reads `display_name`, expose it as a computed property backed by username.
    @property
    def display_name(self) -> Optional[str]:
        return self.username

    def __repr__(self) -> str:
        return f"<AppUser id={self.id} username={self.username!r} email={self.email!r}>"
