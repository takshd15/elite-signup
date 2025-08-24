from __future__ import annotations

import base64
import os
from typing import Optional, Dict, Any

import jwt  # PyJWT
from fastapi import Depends, Header, HTTPException, status


class JwtService:
    """
    Verify-only JWT service compatible with your Java JJWT settings.
    - HS256 signing
    - Secret key is provided as BASE64, then decoded to bytes (same as JJWT's Decoders.BASE64.decode)
    - Standard claims support: sub (user id), jti, exp, iat
    - No token generation here.
    """

    def __init__(
        self,
        base64_key: Optional[str] = None,
        algorithm: str = "HS256",
        leeway_seconds: int = 60,              # small clock skew tolerance
        issuer: Optional[str] = None,
        audience: Optional[str] = None,
    ) -> None:
        self.algorithm = algorithm
        self.leeway_seconds = leeway_seconds
        self.issuer = issuer
        self.audience = audience

        # Mirror Java: Decoders.BASE64.decode(base64Key)
        b64 = base64_key or os.getenv(
            "JWT_SIGNING_KEY_BASE64",
            # fallback to your Java default (change in prod):
            "12341234123412341234123412341234123412341234",
        )
        # pad for safe decoding if needed
        pad = (-len(b64)) % 4
        if pad:
            b64 += "=" * pad
        try:
            self.key_bytes = base64.b64decode(b64)
        except Exception as e:
            raise RuntimeError("Invalid BASE64 JWT secret; set JWT_SIGNING_KEY_BASE64 correctly") from e

    # ---------- core API ----------
    def is_valid(self, token: Optional[str]) -> bool:
        if not token:
            return False
        try:
            self._decode(token)
            return True
        except Exception:
            return False

    def decode(self, token: str) -> Dict[str, Any]:
        """
        Return payload dict. Raises if invalid/expired/signature mismatch.
        """
        return self._decode(token)

    def extract_user_id(self, token: str) -> Optional[str]:
        try:
            payload = self._decode(token)
            sub = payload.get("sub")
            return str(sub) if sub is not None else None
        except Exception:
            return None

    def extract_jti(self, token: str) -> Optional[str]:
        try:
            payload = self._decode(token)
            jti = payload.get("jti")
            return str(jti) if jti is not None else None
        except Exception:
            return None

    # ---------- internals ----------
    def _decode(self, token: str) -> Dict[str, Any]:
        options = {
            "require": [],   # you can enforce required claims here if you want
        }
        kwargs: Dict[str, Any] = {
            "key": self.key_bytes,
            "algorithms": [self.algorithm],
            "options": options,
            "leeway": self.leeway_seconds,
        }
        if self.issuer:
            kwargs["issuer"] = self.issuer
        if self.audience:
            kwargs["audience"] = self.audience
        # PyJWT will verify signature + exp/nbf/iat if present
        return jwt.decode(token, **kwargs)


# Singleton used across the app
jwt_service = JwtService()


# ---------- FastAPI dependency helpers ----------
def require_bearer_token(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    return authorization.split(" ", 1)[1].strip()


def current_user_id(token: str = Depends(require_bearer_token)) -> str:
    """
    Use in your endpoints to get the user_id from the validated JWT.
    Raises 401 if invalid.
    """
    if not jwt_service.is_valid(token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user_id = jwt_service.extract_user_id(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing 'sub' claim")
    return user_id
