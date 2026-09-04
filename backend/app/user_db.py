"""User store — SQLAlchemy Core over SQLite (local) or Postgres (Supabase).

Which database is used is decided entirely by ``DATABASE_URL`` (see config.py):
set it to your Supabase connection string in production, leave it unset for a
local ``data/users.db`` SQLite file. Passwords are bcrypt-hashed either way.

Each account also carries a ``default_budget`` (the CSR pot that user works
with), so different logins land in the app with different budgets.
"""
from __future__ import annotations

import threading
import time
from typing import Optional

import bcrypt
from sqlalchemy import (BigInteger, Column, Float, Integer, MetaData, String,
                        Table, create_engine, insert, select, update)
from sqlalchemy.engine import Engine

from .config import DATABASE_URL

DEFAULT_BUDGET = 5_000_000.0

_lock = threading.Lock()
_metadata = MetaData()

users = Table(
    "users", _metadata,
    Column("id", BigInteger().with_variant(Integer, "sqlite"),
           primary_key=True, autoincrement=True),
    Column("username", String(50), unique=True, nullable=False),
    Column("email", String(255), unique=True, nullable=False),
    Column("password_hash", String(255), nullable=False),
    Column("company_name", String(200), nullable=False, default=""),
    Column("role", String(60), nullable=False, default="CSR Manager"),
    Column("default_budget", Float, nullable=False, default=DEFAULT_BUDGET),
    Column("created_at", Float, nullable=False, default=lambda: time.time()),
)

_engine: Engine | None = None


def _get_engine() -> Engine:
    global _engine
    if _engine is None:
        kw: dict = {"pool_pre_ping": True, "future": True}
        if DATABASE_URL.startswith("sqlite"):
            kw["connect_args"] = {"check_same_thread": False}
        _engine = create_engine(DATABASE_URL, **kw)
    return _engine


def init_db() -> None:
    """Create the users table if it doesn't exist. Safe to call repeatedly."""
    with _lock:
        _metadata.create_all(_get_engine(), checkfirst=True)


def _row_to_dict(row) -> dict:
    m = row._mapping
    return {
        "id": m["id"],
        "username": m["username"],
        "email": m["email"],
        "company_name": m["company_name"],
        "role": m["role"],
        "default_budget": m["default_budget"] if m["default_budget"] is not None else DEFAULT_BUDGET,
    }


def create_user(username: str, email: str, password: str, company_name: str = "",
                role: str = "CSR Manager", default_budget: float = DEFAULT_BUDGET) -> dict:
    """Create a user. Returns the user dict, or raises ValueError on a clash."""
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    with _lock:
        eng = _get_engine()
        # explicit pre-check keeps the error messages friendly across dialects
        with eng.connect() as conn:
            existing = conn.execute(
                select(users.c.username, users.c.email).where(
                    (users.c.username == username) | (users.c.email == email)
                )
            ).first()
        if existing:
            if existing._mapping["username"] == username:
                raise ValueError("Username already taken")
            raise ValueError("Email already registered")
        with eng.begin() as conn:
            result = conn.execute(
                insert(users).values(
                    username=username, email=email, password_hash=password_hash,
                    company_name=company_name, role=role, default_budget=default_budget,
                ).returning(users.c.id)
            )
            user_id = result.scalar_one()
    return {
        "id": user_id, "username": username, "email": email,
        "company_name": company_name, "role": role, "default_budget": default_budget,
    }


def verify_user(username: str, password: str) -> Optional[dict]:
    with _get_engine().connect() as conn:
        row = conn.execute(select(users).where(users.c.username == username)).first()
    if not row:
        return None
    if not bcrypt.checkpw(password.encode(), row._mapping["password_hash"].encode()):
        return None
    return _row_to_dict(row)


def get_user_by_id(user_id: int) -> Optional[dict]:
    with _get_engine().connect() as conn:
        row = conn.execute(select(users).where(users.c.id == user_id)).first()
    return _row_to_dict(row) if row else None


def get_user_by_username(username: str) -> Optional[dict]:
    with _get_engine().connect() as conn:
        row = conn.execute(select(users).where(users.c.username == username)).first()
    return _row_to_dict(row) if row else None


def _set_budget(username: str, budget: float) -> None:
    with _get_engine().begin() as conn:
        conn.execute(update(users).where(users.c.username == username).values(default_budget=budget))


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
    """Ensure every demo login exists (idempotent) with its seeded budget.

    Skipped entirely when SAARTHI_SEED_DEMO=0 — useful once a production
    deployment has real users and you don't want the demo accounts.
    """
    import os
    if os.getenv("SAARTHI_SEED_DEMO", "1").lower() in {"0", "false", "no"}:
        init_db()
        return

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
            pass  # created concurrently by another worker
