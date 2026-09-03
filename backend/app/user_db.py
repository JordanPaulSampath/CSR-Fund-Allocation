"""Real user database — SQLite + bcrypt for password hashing.

Replaces the hardcoded demo auth with a proper user store.
Companies sign up, members log in, passwords are hashed.
"""
from __future__ import annotations

import hashlib
import hmac
import sqlite3
import threading
import time
from pathlib import Path
from typing import Optional

import bcrypt

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "users.db"

_lock = threading.Lock()


def _get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    """Create the users table if it doesn't exist."""
    with _lock:
        conn = _get_conn()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                company_name TEXT NOT NULL DEFAULT '',
                role TEXT NOT NULL DEFAULT 'CSR Manager',
                created_at REAL NOT NULL DEFAULT (strftime('%s','now'))
            )
        """)
        conn.commit()
        conn.close()


def seed_demo_user() -> None:
    """Ensure the demo logins always exist.

    The frontend login page and every smoke test authenticate as these users, so
    the app has to be usable straight after a clean checkout with no signup step.
    The primary account's credentials come from config
    (``SAARTHI_USER`` / ``SAARTHI_PASSWORD``).
    """
    from .config import DEMO_PASSWORD, DEMO_USERNAME

    init_db()
    accounts = [
        (DEMO_USERNAME, DEMO_PASSWORD, "Saarthi Demo Corp", "CSR Manager"),
        ("demo", "demo12345", "Demo Industries Ltd.", "CSR Manager"),
    ]
    for username, password, company, role in accounts:
        if get_user_by_username(username):
            continue
        try:
            create_user(
                username=username,
                email=f"{username}@saarthi.demo",
                password=password,
                company_name=company,
                role=role,
            )
        except ValueError:
            # created concurrently by another worker — fine
            pass


def create_user(username: str, email: str, password: str, company_name: str = "", role: str = "CSR Manager") -> dict:
    """Create a new user. Returns user dict or raises ValueError."""
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    with _lock:
        conn = _get_conn()
        try:
            conn.execute(
                "INSERT INTO users (username, email, password_hash, company_name, role) VALUES (?, ?, ?, ?, ?)",
                (username, email, password_hash, company_name, role),
            )
            conn.commit()
            user_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        except sqlite3.IntegrityError as e:
            conn.close()
            if "username" in str(e):
                raise ValueError("Username already taken")
            elif "email" in str(e):
                raise ValueError("Email already registered")
            raise ValueError("User already exists")
        finally:
            conn.close()
    return {"id": user_id, "username": username, "email": email, "company_name": company_name, "role": role}


def verify_user(username: str, password: str) -> Optional[dict]:
    """Verify credentials. Returns user dict or None."""
    with _lock:
        conn = _get_conn()
        row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        conn.close()
    if not row:
        return None
    if not bcrypt.checkpw(password.encode("utf-8"), row["password_hash"].encode("utf-8")):
        return None
    return {
        "id": row["id"],
        "username": row["username"],
        "email": row["email"],
        "company_name": row["company_name"],
        "role": row["role"],
    }


def get_user_by_id(user_id: int) -> Optional[dict]:
    with _lock:
        conn = _get_conn()
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        conn.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "username": row["username"],
        "email": row["email"],
        "company_name": row["company_name"],
        "role": row["role"],
    }


def get_user_by_username(username: str) -> Optional[dict]:
    with _lock:
        conn = _get_conn()
        row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        conn.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "username": row["username"],
        "email": row["email"],
        "company_name": row["company_name"],
        "role": row["role"],
    }
