from __future__ import annotations

import json
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from db import SessionLocal  # your session factory (sync)
from security.jwt_util import jwt_service
from security import token_revocation, verification_code
from security.sanitizer import sanitize_text, sanitize_json_obj


class AuthCORSFilterMiddleware(BaseHTTPMiddleware):
    """
    Mirrors the Java AuthCORSFilter logic:
      - CORS headers
      - Preflight
      - JWT validation + revocation
      - Request sanitization (headers, query string, JSON body)
    """

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable):
        # ---- 1) CORS headers
        origin = request.headers.get("Origin")
        headers = {
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
            "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, X-Requested-With, Origin",
            "Access-Control-Max-Age": "3600",
            "Vary": "Origin",
        }
        if origin:
            headers["Access-Control-Allow-Origin"] = origin

        # ---- 2) Preflight
        if request.method.upper() == "OPTIONS":
            return Response(status_code=200, headers=headers)

        # ---- sanitize headers (best effort)
        sanitized_headers = {k: (sanitize_text(v) or "") for k, v in request.headers.items()}

        client_ixp = request.client.host

        path = request.url.path or "/"

        # ---- Allow /v1/status
        if path.startswith("/v1/parser/health"):
            response = await call_next(request)
            self._apply_cors(response, headers)
            return response

        # ---- 5) Extract and validate token
        auth_header = request.headers.get("Authorization") or ""
        token = auth_header[7:].strip() if auth_header.startswith("Bearer ") else None

        user_id = jwt_service.extract_user_id(token) if token else None
        jti = jwt_service.extract_jti(token) if token else None

        if not token or not jwt_service.is_valid(token) or token_revocation.is_revoked(jti):
            return Response(
                content='{"error":"Unauthorized: invalid or missing token"}',
                media_type="application/json",
                status_code=401,
                headers=headers,
            )

        # attach user id for routers
        request.state.user_id = user_id

        # ---- 6) latest verification code gate (allow verify/resend even if not validated)

        # Disabled for now so i can just send a valid token

        # if not ("/v1/auth/verify" in path or "/v1/auth/resend" in path):
        #     with SessionLocal() as db:
        #         ok =verification_code.latest_code_is_valid_for_request(db, user_id, client_ixp)
        #     if not ok:
        #         return Response(
        #             content='{"error":"Access denied: you must verify your latest code before proceeding."}',
        #             media_type="application/json",
        #             status_code=403,
        #             headers=headers,
        #         )

        # ---- sanitize query string (best effort)
        if request.query_params:
            # Starlette keeps raw query_string in scope
            raw_qs = request.scope.get("query_string", b"").decode("utf-8", "ignore")
            clean_qs = sanitize_text(raw_qs) or ""
            request.scope["query_string"] = clean_qs.encode("utf-8")

        # ---- sanitize JSON bodies (if any)
        if request.headers.get("content-type", "").startswith("application/json"):
            try:
                body = await request.body()
                if body:
                    data = json.loads(body.decode("utf-8"))
                    clean = sanitize_json_obj(data)
                    new_body = json.dumps(clean).encode("utf-8")

                    async def receive():
                        return {"type": "http.request", "body": new_body, "more_body": False}

                    request._receive = receive  # monkey-patch receive
            except Exception:
                # ignore on parse error; let downstream validation handle it
                pass

        response = await call_next(request)
        self._apply_cors(response, headers)
        return response

    @staticmethod
    def _apply_cors(response: Response, headers: dict):
        for k, v in headers.items():
            response.headers.setdefault(k, v)
