# models/jwt_revocation.py
from __future__ import annotations

from datetime import datetime
from sqlalchemy import Text, DateTime, func, Index
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base

class JwtRevocation(Base):
    __tablename__ = "public.jwt_revocation"

    jti: Mapped[str] = mapped_column(Text, primary_key=True)
    revoked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    def __repr__(self) -> str:
        return f"<JwtRevocation jti={self.jti} revoked_at={self.revoked_at}>"
