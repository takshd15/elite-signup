from __future__ import annotations

import uuid
from typing import Optional
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
    Index,
    CheckConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base
from models.user import AppUser
from models.user_challenge import UserChallenge


# =========================
# Daily pack (one per user per calendar day)
# =========================

class DailyPack(Base):
    __tablename__ = "daily_pack"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("app_user.id", ondelete="CASCADE"), nullable=False
    )
    day: Mapped[date] = mapped_column(Date, nullable=False)  # e.g., 2025-08-23

    title: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user: Mapped[AppUser] = relationship(backref="daily_packs")
    items: Mapped[list["DailyPackItem"]] = relationship(
        back_populates="pack",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    # Convenient, read-only access to the challenges in this pack
    user_challenges: Mapped[list[UserChallenge]] = relationship(
        secondary="daily_pack_item",
        viewonly=True,
    )

    __table_args__ = (
        UniqueConstraint("user_id", "day", name="uq_daily_pack_user_day"),
        Index("ix_daily_pack_user_day", "user_id", "day"),
    )

    def __repr__(self) -> str:
        return f"<DailyPack id={self.id} user={self.user_id} day={self.day}>"


class DailyPackItem(Base):
    __tablename__ = "daily_pack_item"

    pack_id: Mapped[int] = mapped_column(ForeignKey("daily_pack.id", ondelete="CASCADE"), primary_key=True)
    user_challenge_id: Mapped[int] = mapped_column(
        ForeignKey("user_challenge.id", ondelete="CASCADE"), primary_key=True
    )
    position: Mapped[Optional[int]] = mapped_column(Integer)  # optional ordering 1..N

    pack: Mapped[DailyPack] = relationship(back_populates="items")
    user_challenge: Mapped[UserChallenge] = relationship()

    __table_args__ = (
        Index("ix_daily_pack_item_pack", "pack_id"),
        Index("ix_daily_pack_item_uc", "user_challenge_id"),
        # (Optional) Guard that this item is a same-day challenge:
        # enforce in service layer: user_challenge.period_start == pack.day
    )

    def __repr__(self) -> str:
        return f"<DailyPackItem pack={self.pack_id} uc={self.user_challenge_id} pos={self.position}>"


# =========================
# Monthly pack (one per user per calendar month)
# =========================

class MonthlyPack(Base):
    __tablename__ = "monthly_pack"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("app_user.id", ondelete="CASCADE"), nullable=False
    )
    month_start: Mapped[date] = mapped_column(Date, nullable=False)  # first day of the month

    title: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user: Mapped[AppUser] = relationship(backref="monthly_packs")
    items: Mapped[list["MonthlyPackItem"]] = relationship(
        back_populates="pack",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    user_challenges: Mapped[list[UserChallenge]] = relationship(
        secondary="monthly_pack_item",
        viewonly=True,
    )

    __table_args__ = (
        UniqueConstraint("user_id", "month_start", name="uq_monthly_pack_user_month"),
        Index("ix_monthly_pack_user_month", "user_id", "month_start"),
        # Optional sanity check: force month_start to be a 1st day (enable if you want DB-level guard)
        # CheckConstraint("date_part('day', month_start) = 1", name="ck_monthly_pack_start_first"),
    )

    def __repr__(self) -> str:
        return f"<MonthlyPack id={self.id} user={self.user_id} month={self.month_start}>"


class MonthlyPackItem(Base):
    __tablename__ = "monthly_pack_item"

    pack_id: Mapped[int] = mapped_column(ForeignKey("monthly_pack.id", ondelete="CASCADE"), primary_key=True)
    user_challenge_id: Mapped[int] = mapped_column(
        ForeignKey("user_challenge.id", ondelete="CASCADE"), primary_key=True
    )
    position: Mapped[Optional[int]] = mapped_column(Integer)  # optional ordering 1..N

    pack: Mapped[MonthlyPack] = relationship(back_populates="items")
    user_challenge: Mapped[UserChallenge] = relationship()

    __table_args__ = (
        Index("ix_monthly_pack_item_pack", "pack_id"),
        Index("ix_monthly_pack_item_uc", "user_challenge_id"),
        # Enforce in service layer: user_challenge.period_start within target month
    )

    def __repr__(self) -> str:
        return f"<MonthlyPackItem pack={self.pack_id} uc={self.user_challenge_id} pos={self.position}>"
