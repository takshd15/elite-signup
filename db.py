# db.py
from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Generator
from urllib.parse import urlparse

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import Session, sessionmaker

# Declarative base
from models.base import Base


def _compose_sqla_url() -> str:

    direct = os.getenv("DATABASE_URL")
    if direct:
        return direct

    jdbc = os.getenv("DB_URL")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASS")

    if not jdbc:
        # final fallback (local dev)
        return "postgresql+psycopg://postgres:postgres@localhost:5432/elitescore"

    # strip 'jdbc:' prefix if present
    if jdbc.startswith("jdbc:"):
        jdbc = jdbc[len("jdbc:") : ]

    # parse the JDBC URL (now a normal postgres URL without credentials)
    # e.g. postgresql://host:5432/dbname
    parsed = urlparse(jdbc)
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432
    dbname = (parsed.path or "/elitescore").lstrip("/")

    # Build SQLAlchemy URL for psycopg3
    user = user or "postgres"
    password = password or ""
    return f"postgresql+psycopg://{user}:{password}@{host}:{port}/{dbname}"


# ---------------------------------------------------------------------
# Engine & Session factory (sync)
# ---------------------------------------------------------------------
DATABASE_URL = _compose_sqla_url()

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,        # like Hikari's connectivity check
    pool_size=20,              # Hikari maximumPoolSize
    max_overflow=0,            # keep a hard cap like Hikari
    pool_timeout=10,           # seconds (Hikari's connectionTimeout ~ 10_000ms)
    isolation_level="READ COMMITTED",
    future=True,
)


@event.listens_for(engine, "connect")
def _set_utc_and_isolation(dbapi_conn, _conn_record):
    """Ensure UTC timezone (PostgreSQL) and leave autocommit disabled."""
    try:
        cur = dbapi_conn.cursor()
        cur.execute("SET TIME ZONE 'UTC'")
        cur.close()
    except Exception:
        # Non-Postgres driver or failure — ignore
        pass


SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,      # explicit transactions like in Java
    autoflush=False,
    expire_on_commit=False,
    future=True,
)

# ---------------------------------------------------------------------
# FastAPI dependency (sync)
# ---------------------------------------------------------------------
def get_session() -> Generator[Session, None, None]:
    """
    Per-request session:
    - open
    - yield
    - commit if OK, else rollback
    - always close
    """
    session: Session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

# ---------------------------------------------------------------------
# Helpers (scripts/cron)
# ---------------------------------------------------------------------
@contextmanager
def session_scope() -> Generator[Session, None, None]:
    session: Session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_db(create_all: bool = False) -> None:
    """Ping DB; optionally create tables (dev only — use Alembic in prod)."""
    with SessionLocal() as s:
        s.execute(text("SELECT 1"))
    if create_all:
        Base.metadata.create_all(bind=engine)
