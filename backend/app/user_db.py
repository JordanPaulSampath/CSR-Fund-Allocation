"""Real user database — SQLite + bcrypt for password hashing.

Replaces the hardcoded demo auth with a proper user store.
Companies sign up, members log in, passwords are hashed. Each account also
carries a ``default_budget`` (the CSR pot that user works with), so different
logins land in the app with different budgets.
"""
from __future__ import annotations

import sqlite3
import threading
from pathlib import Path
from typing import Optional

import bcrypt

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "users.db"

DEFAULT_BUDGET = 5_000_000.0

_lock = threading.Lock()


def _get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    """Create the users table if needed; add newer columns to old DBs."""
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
                default_budget REAL NOT NULL DEFAULT 5000000,
                created_at REAL NOT NULL DEFAULT (strftime('%s','now'))
            )
        """)
        cols = {r["name"] for r in conn.execute("PRAGMA table_info(users)")}
        if "default_budget" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN default_budget REAL NOT NULL DEFAULT 5000000")
        conn.commit()
        conn.close()


# username, password, company, role, default_budget (₹)
_DEMO_ACCOUNTS = [
    ("csr_manager",     "saarthi2026",  "Saarthi Demo Corp",     "CSR Manager",         5_000_000),
    ("demo",            "demo12345",    "Demo Industries Ltd.",  "CSR Manager",         2_500_000),
    ("analyst",         "analyst2026",  "Saarthi Demo Corp",     "CSR Analyst",         1_000_000),
    ("program_officer", "program2026",  "Saarthi Demo Corp",     "Program Officer",     3_500_000),
    ("cfo",             "finance2026",  "Saarthi Demo Corp",     "Finance Head",       25_000_000),
    ("auditor",         "auditor2026",  "Saarthi Demo Corp",     "Compliance Auditor",  5_000_000),
    ("board",           "board2026",    "Saarthi Demo Corp",     "Board Member",       50_000_000),
    ("regional_lead",   "region2026",   "Saarthi Demo Corp",     "Regional Lead",       7_500_000),
    ("foundation_head", "foundation26", "Saarthi Foundation",    "Foundation Head",   100_000_000),
    ("enterprise",      "enterprise26", "Bharat Infra Ltd.",     "Group CSR Head",    500_000_000),
]


def seed_demo_user() -> None:
    """Ensure every demo login exists (idempotent). Also nudges each account's
    ``default_budget`` to the seeded value so the numbers stay predictable."""
    init_db()
    for username, password, company, role, budget in _DEMO_ACCOUNTS:
        existing = get_user_by_username(username)
        if existing:
            if existing.get("default_budget") != float(budget):
                _set_budget(username, float(budget))
            continue
        try:
            create_user(username, f"{username}@saarthi.demo", password,
                        company_name=company, role=role, default_budget=float(budget))
        except ValueError:
            pass


def _set_budget(username: str, budget: float) -> None:
    with _lock:
        conn = _get_conn()
        conn.execute("UPDATE users SET default_budget = ? WHERE username = ?", (budget, username))
        conn.commit()
        conn.close()


def _row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "username": row["username"],
        "email": row["email"],
        "company_name": row["company_name"],
        "role": row["role"],
        "default_budget": row["default_budget"] if "default_budget" in row.keys() else DEFAULT_BUDGET,
    }


def create_user(username: str, email: str, password: str, company_name: str = "",
                role: str = "CSR Manager", default_budget: float = DEFAULT_BUDGET) -> dict:
    """Create a new user. Returns user dict or raises ValueError."""
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    with _lock:
        conn = _get_conn()
        try:
            conn.execute(
                "INSERT INTO users (username, email, password_hash, company_name, role, default_budget) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (username, email, password_hash, company_name, role, default_budget),
            )
            conn.commit()
            user_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        except sqlite3.IntegrityError as e:
            conn.close()
            if "username" in str(e):
                raise ValueError("Username already taken")
            if "email" in str(e):
                raise ValueError("Email already registered")
            raise ValueError("User already exists")
        finally:
            conn.close()
    return {
        "id": user_id, "username": username, "email": email,
        "company_name": company_name, "role": role, "default_budget": default_budget,
    }


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
    return _row_to_dict(row)


def get_user_by_id(user_id: int) -> Optional[dict]:
    with _lock:
        conn = _get_conn()
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        conn.close()
    return _row_to_dict(row) if row else None


def get_user_by_username(username: str) -> Optional[dict]:
    with _lock:
        conn = _get_conn()
        row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        conn.close()
    return _row_to_dict(row) if row else None
