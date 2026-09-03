"""Real auth — JWT tokens + bcrypt passwords backed by SQLite user DB.

Replaces the hardcoded demo login with proper multi-user auth.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import time
import base64

from fastapi import Depends, Header, HTTPException, status

from .config import AUTH_ENABLED, AUTH_SECRET, TOKEN_TTL_SECONDS
from .user_db import verify_user, get_user_by_username


def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _b64d(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def create_token(username: str, user_id: int) -> tuple[str, int]:
    """Create a signed JWT-like token with user_id and username."""
    payload = {
        "sub": username,
        "uid": user_id,
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    body = _b64e(json.dumps(payload, separators=(",", ":")).encode())
    sig = _b64e(hmac.new(AUTH_SECRET.encode(), body.encode(), hashlib.sha256).digest())
    return f"{body}.{sig}", TOKEN_TTL_SECONDS


def decode_token(token: str) -> dict:
    """Decode and verify token. Returns payload dict with 'sub' and 'uid'."""
    try:
        body, sig = token.split(".", 1)
        expected = _b64e(
            hmac.new(AUTH_SECRET.encode(), body.encode(), hashlib.sha256).digest()
        )
        if not hmac.compare_digest(sig, expected):
            raise ValueError("bad signature")
        payload = json.loads(_b64d(body))
        if payload.get("exp", 0) < time.time():
            raise ValueError("expired")
        return payload
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token ({exc}).",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def current_user(authorization: str | None = Header(default=None)) -> dict:
    """Extract and verify user from Bearer token. Returns full user dict."""
    if not AUTH_ENABLED:
        return {"id": 0, "username": "csr_manager", "email": "demo@csr.com", "company_name": "Demo Corp", "role": "CSR Manager"}
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token. POST /auth/login first.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(authorization.split(" ", 1)[1].strip())
    username = payload.get("sub")
    user = get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    return user


RequireUser = Depends(current_user)
