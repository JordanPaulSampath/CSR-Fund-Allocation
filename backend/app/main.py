"""Saarthi API — CSR Manager scores NGO proposals and allocates a fixed budget.

Single process, in-memory store, direct function calls into the optimizer.
Run:
    uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import __version__
from .auth import RequireUser, create_token
from .config import DEFAULT_WEIGHTS, load_weights, save_weights
from .data_loader import load_from_text, load_sample_dataset
from .models import Proposal, store
from .optimizer import allocate_budget, compare_strategies
from .schemas import (AllocationResult, CompareResult, LoginIn, ProposalIn,
                      ProposalOut, TokenOut, WeightsIn, WeightsOut)
from .scoring import score_proposal
from .user_db import init_db, create_user, verify_user

app = FastAPI(
    title="CSR Helper API",
    version=__version__,
    description="Score NGO proposals and optimally allocate a fixed CSR budget.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_last_allocation: dict | None = None


# --------------------------------------------------------------------------- #
# Pydantic models for signup
# --------------------------------------------------------------------------- #
class SignupIn(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    company_name: str = Field(default="", max_length=200)


# --------------------------------------------------------------------------- #
# meta
# --------------------------------------------------------------------------- #
@app.get("/", tags=["meta"])
def root():
    return {
        "name": "CSR Helper API",
        "version": __version__,
        "docs": "/docs",
        "proposals_loaded": len(store),
    }


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "proposals_loaded": len(store), "weights": load_weights()}


# --------------------------------------------------------------------------- #
# auth — real signup + login
# --------------------------------------------------------------------------- #
@app.post("/auth/signup", response_model=TokenOut, tags=["auth"])
def signup(payload: SignupIn):
    """Register a new company user."""
    try:
        user = create_user(
            username=payload.username,
            email=payload.email,
            password=payload.password,
            company_name=payload.company_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    token, ttl = create_token(user["username"], user["id"])
    return TokenOut(
        access_token=token,
        expires_in=ttl,
        user=user["username"],
        company_name=user["company_name"],
        email=user["email"],
        role=user["role"],
    )


@app.post("/auth/login", response_model=TokenOut, tags=["auth"])
def login(payload: LoginIn):
    """Login with username/password."""
    user = verify_user(payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    token, ttl = create_token(user["username"], user["id"])
    return TokenOut(
        access_token=token,
        expires_in=ttl,
        user=user["username"],
        company_name=user["company_name"],
        email=user["email"],
        role=user["role"],
    )


@app.get("/auth/me", tags=["auth"])
def me(user: dict = RequireUser):
    """Get current user info."""
    return {
        "id": user["id"],
        "user": user["username"],
        "username": user["username"],
        "email": user["email"],
        "company_name": user["company_name"],
        "role": user["role"],
    }


# --------------------------------------------------------------------------- #
# proposals
# --------------------------------------------------------------------------- #
def _to_out(p: Proposal) -> ProposalOut:
    return ProposalOut(**p.to_dict())


@app.get("/proposals", response_model=List[ProposalOut], tags=["proposals"])
def list_proposals(
    sector: Optional[str] = None,
    region: Optional[str] = None,
    funded: Optional[bool] = None,
):
    items = store.all()
    if sector:
        items = [p for p in items if p.sector.lower() == sector.lower()]
    if region:
        items = [p for p in items if p.region.lower() == region.lower()]
    if funded is not None:
        items = [p for p in items if p.is_funded == funded]
    return [_to_out(p) for p in items]


@app.get("/proposals/{proposal_id}", response_model=ProposalOut, tags=["proposals"])
def get_proposal(proposal_id: int):
    p = store.get(proposal_id)
    if not p:
        raise HTTPException(404, f"Proposal {proposal_id} not found.")
    return _to_out(p)


@app.post("/proposals", response_model=ProposalOut, status_code=201, tags=["proposals"])
def add_proposal(payload: ProposalIn, user: dict = RequireUser):
    p = Proposal(id=0, **payload.model_dump())
    score_proposal(p)
    return _to_out(store.add(p))


@app.post("/proposals/bulk", response_model=List[ProposalOut], tags=["proposals"])
def add_proposals_bulk(payloads: List[ProposalIn], user: dict = RequireUser):
    created = []
    for payload in payloads:
        p = Proposal(id=0, **payload.model_dump())
        score_proposal(p)
        created.append(store.add(p))
    return [_to_out(p) for p in created]


@app.delete("/proposals/{proposal_id}", status_code=204, tags=["proposals"])
def delete_proposal(proposal_id: int, user: dict = RequireUser):
    if not store.delete(proposal_id):
        raise HTTPException(404, f"Proposal {proposal_id} not found.")


@app.post("/proposals/reset", tags=["proposals"])
def reset_proposals(user: dict = RequireUser):
    global _last_allocation
    store.clear()
    _last_allocation = None
    return {"status": "cleared", "proposals_loaded": 0}


@app.post("/proposals/load-samples", response_model=List[ProposalOut], tags=["proposals"])
def load_samples(replace: bool = True, user: dict = RequireUser):
    try:
        created = load_sample_dataset(replace=replace)
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc))
    return [_to_out(p) for p in created]


@app.post("/proposals/upload-csv", response_model=List[ProposalOut], tags=["proposals"])
async def upload_csv(file: UploadFile = File(...), replace: bool = True,
                     user: dict = RequireUser):
    raw = (await file.read()).decode("utf-8-sig")
    try:
        created = load_from_text(raw, replace=replace)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    return [_to_out(p) for p in created]


# --------------------------------------------------------------------------- #
# scoring / weights
# --------------------------------------------------------------------------- #
@app.get("/scoring/weights", response_model=WeightsOut, tags=["scoring"])
def get_weights():
    return WeightsOut(**load_weights())


@app.put("/scoring/weights", response_model=WeightsOut, tags=["scoring"])
def update_weights(payload: WeightsIn, user: dict = RequireUser):
    updated = save_weights(payload.model_dump(exclude_none=True))
    for p in store.all():
        score_proposal(p, updated)
        store.update(p)
    return WeightsOut(**updated)


@app.post("/scoring/reset-weights", response_model=WeightsOut, tags=["scoring"])
def reset_weights(user: dict = RequireUser):
    updated = save_weights(DEFAULT_WEIGHTS)
    for p in store.all():
        score_proposal(p, updated)
        store.update(p)
    return WeightsOut(**updated)


@app.post("/scoring/recompute", response_model=List[ProposalOut], tags=["scoring"])
def recompute_scores(user: dict = RequireUser):
    weights = load_weights(force=True)
    for p in store.all():
        score_proposal(p, weights)
        store.update(p)
    return [_to_out(p) for p in store.all()]


# --------------------------------------------------------------------------- #
# allocation
# --------------------------------------------------------------------------- #
def _run_allocation(total_budget: float, strategy: str) -> dict:
    global _last_allocation
    if len(store) == 0:
        raise HTTPException(400, "No proposals loaded. POST /proposals/load-samples first.")
    proposals = store.all()
    result = allocate_budget(proposals, total_budget, strategy=strategy)
    funded_ids = {p["id"] for p in result["funded"]}
    for p in proposals:
        p.is_funded = p.id in funded_ids
        p.allocated_amount = p.requested_amount if p.is_funded else 0.0
        store.update(p)
    _last_allocation = result
    return result


@app.post("/allocate", response_model=AllocationResult, tags=["allocation"])
def allocate(
    total_budget: float = Query(..., description="Fixed CSR budget in ₹"),
    strategy: str = Query("optimizer", pattern="^(optimizer|ranked|greedy)$"),
):
    return _run_allocation(total_budget, strategy)


@app.get("/allocate/last", response_model=AllocationResult, tags=["allocation"])
def last_allocation():
    if _last_allocation is None:
        raise HTTPException(404, "No allocation has been run yet.")
    return _last_allocation


@app.post("/allocate/compare", response_model=CompareResult, tags=["allocation"])
def allocate_compare(total_budget: float = Query(..., description="Fixed CSR budget in ₹")):
    if len(store) == 0:
        raise HTTPException(400, "No proposals loaded.")
    result = compare_strategies(store.all(), total_budget)
    _run_allocation(total_budget, "optimizer")
    return result


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #
@app.get("/meta/sectors", tags=["meta"])
def sectors():
    return sorted({p.sector for p in store.all()})


@app.get("/meta/regions", tags=["meta"])
def regions():
    return sorted({p.region for p in store.all()})


@app.get("/stats", tags=["meta"])
def stats():
    items = store.all()
    funded = [p for p in items if p.is_funded]
    return {
        "proposals": len(items),
        "funded": len(funded),
        "rejected": len(items) - len(funded),
        "total_requested": round(sum(p.requested_amount for p in items), 2),
        "total_allocated": round(sum(p.allocated_amount for p in funded), 2),
        "beneficiaries_funded": sum(p.beneficiaries for p in funded),
        "beneficiaries_total": sum(p.beneficiaries for p in items),
        "avg_score": round(
            sum(p.final_score for p in items) / len(items), 2
        ) if items else 0.0,
    }


@app.on_event("startup")
def _seed_on_startup():
    """Init user DB + auto-load sample dataset on boot."""
    init_db()
    if len(store) == 0:
        try:
            load_sample_dataset(replace=True)
        except FileNotFoundError:
            pass
