from __future__ import annotations

from typing import Optional, List
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base
from models.user import AppUser
from models.user_challenge import UserChallenge


# =========================
# Daily pack (one per user per calendar day)
# =========================

class DailyPack(Base):
    __tablename__ = "daily_pack"
    __table_args__ = (
        UniqueConstraint("user_id", "day", name="uq_daily_pack_user_day"),
        Index("ix_daily_pack_user_day", "user_id", "day"),
        {"schema": "challenges_schema"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("public.users_auth.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    day: Mapped[date] = mapped_column(Date, nullable=False)

    title: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped[AppUser] = relationship(backref="daily_packs")

    items: Mapped[List["DailyPackItem"]]= relationship(
        "DailyPackItem",
        back_populates="pack",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Read-only convenience: all UCs in this pack via the association table
    user_challenges: Mapped[List[UserChallenge]] = relationship(
        "UserChallenge",
        secondary="challenges_schema.daily_pack_item",
        primaryjoin="DailyPack.id == DailyPackItem.pack_id",
        secondaryjoin="DailyPackItem.user_challenge_id == UserChallenge.id",
        viewonly=True,
    )

    def __repr__(self) -> str:
        return f"<DailyPack id={self.id} user={self.user_id} day={self.day}>"


class DailyPackItem(Base):
    __tablename__ = "daily_pack_item"
    __table_args__ = (
        Index("ix_daily_pack_item_pack", "pack_id"),
        Index("ix_daily_pack_item_uc", "user_challenge_id"),
        {"schema": "challenges_schema"},
    )

    pack_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("challenges_schema.daily_pack.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_challenge_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("challenges_schema.user_challenge.id", ondelete="CASCADE"),
        primary_key=True,
    )
    position: Mapped[Optional[int]] = mapped_column(Integer)

    pack: Mapped[DailyPack] = relationship("DailyPack", back_populates="items")
    user_challenge: Mapped[UserChallenge] = relationship("UserChallenge")

    def __repr__(self) -> str:
        return f"<DailyPackItem pack={self.pack_id} uc={self.user_challenge_id} pos={self.position}>"


# =========================
# Monthly pack (one per user per calendar month)
# =========================

class MonthlyPack(Base):
    __tablename__ = "monthly_pack"
    __table_args__ = (
        UniqueConstraint("user_id", "month_start", name="uq_monthly_pack_user_month"),
        Index("ix_monthly_pack_user_month", "user_id", "month_start"),
        {"schema": "challenges_schema"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # NOTE: switched to INTEGER auth id, not UUID
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("public.users_auth.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    month_start: Mapped[date] = mapped_column(Date, nullable=False)

    title: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped[AppUser] = relationship(backref="monthly_packs")

    items: Mapped[List["MonthlyPackItem"]] = relationship(
        "MonthlyPackItem",
        back_populates="pack",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    user_challenges: Mapped[List[UserChallenge]] = relationship(
        "UserChallenge",
        secondary="challenges_schema.monthly_pack_item",
        primaryjoin="MonthlyPack.id == MonthlyPackItem.pack_id",
        secondaryjoin="MonthlyPackItem.user_challenge_id == UserChallenge.id",
        viewonly=True,
    )

    def __repr__(self) -> str:
        return f"<MonthlyPack id={self.id} user={self.user_id} month={self.month_start}>"


class MonthlyPackItem(Base):
    __tablename__ = "monthly_pack_item"
    __table_args__ = (
        Index("ix_monthly_pack_item_pack", "pack_id"),
        Index("ix_monthly_pack_item_uc", "user_challenge_id"),
        {"schema": "challenges_schema"},
    )

    pack_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("challenges_schema.monthly_pack.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_challenge_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("challenges_schema.user_challenge.id", ondelete="CASCADE"),
        primary_key=True,
    )
    position: Mapped[Optional[int]] = mapped_column(Integer)

    pack: Mapped[MonthlyPack] = relationship("MonthlyPack", back_populates="items")
    user_challenge: Mapped[UserChallenge] = relationship("UserChallenge")

    def __repr__(self) -> str:
        return f"<MonthlyPackItem pack={self.pack_id} uc={self.user_challenge_id} pos={self.position}>"
