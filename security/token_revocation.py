# security/token_revocation.py
from __future__ import annotations

from typing import Optional

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from db import SessionLocal
from models import JwtRevocation

def is_revoked(jti: Optional[str], db: Optional[Session] = None) -> bool:
    if not jti:
        return False
    owns = False
    if db is None:
        db = SessionLocal()
        owns = True
    try:
        row = db.execute(
            select(JwtRevocation.JwtRevocation.jti).where(JwtRevocation.JwtRevocation.jti == jti).limit(1)
        ).first()
        return row is not None
    finally:
        if owns:
            db.close()
