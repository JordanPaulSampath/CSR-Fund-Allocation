"""Saarthi API — CSR Manager scores NGO proposals and allocates a fixed budget.

Single process, in-memory store, direct function calls into the optimizer.
Run:
    uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Built single-page app (produced by ``npm run build`` in ../frontend).
# When present, this same server serves the UI *and* the API on one port.
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

from . import __version__
from . import ledger
from . import partners as partners_mod
from .auth import RequireUser, create_token
from .budget_advisor import recommend as recommend_budget
from .config import DATA_DIR, DEFAULT_WEIGHTS, load_weights, save_weights
from .data_loader import load_from_text, load_sample_dataset
from .dataset_meta import DATASET_INFO
from .models import Proposal, store
from .optimizer import allocate_budget, compare_strategies
from .schemas import (AllocationResult, BudgetSuggestion, CompareResult, LoginIn,
                      PartnerMatchResult, PartnerOut, ProposalIn, ProposalOut,
                      TokenOut, WeightsIn, WeightsOut)
from .scoring import score_proposal
from .user_db import create_user, init_db, seed_demo_user, verify_user


def _bootstrap() -> None:
    """Idempotent startup work — safe to call at import and on lifespan start.

    Runs at import time too so a bare ``TestClient(app)`` (no context manager)
    still gets a seeded user DB and sample data.
    """
    init_db()
    seed_demo_user()
    partners_mod.store.load(force=True)
    if len(store) == 0:
        try:
            load_sample_dataset(replace=True)
        except FileNotFoundError:
            pass


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _bootstrap()
    yield


app = FastAPI(
    title="CSR Helper API",
    version=__version__,
    description="Score NGO proposals and optimally allocate a fixed CSR budget.",
    lifespan=lifespan,
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
@app.get("/api", tags=["meta"])
def api_root():
    return {
        "name": "CSR Helper API",
        "version": __version__,
        "docs": "/docs",
        "proposals_loaded": len(store),
        "ui_bundled": FRONTEND_DIST.exists(),
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
        default_budget=user.get("default_budget", 5_000_000),
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
        default_budget=user.get("default_budget", 5_000_000),
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
        "default_budget": user.get("default_budget", 5_000_000),
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
    ledger.clear()
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
def _run_allocation(total_budget: float, strategy: str,
                    max_per_region_ratio: float | None = None) -> dict:
    global _last_allocation
    if len(store) == 0:
        raise HTTPException(400, "No proposals loaded. POST /proposals/load-samples first.")
    proposals = store.all()
    result = allocate_budget(proposals, total_budget, strategy=strategy,
                             max_per_region_ratio=max_per_region_ratio)
    funded_ids = {p["id"] for p in result["funded"]}
    for p in proposals:
        p.is_funded = p.id in funded_ids
        p.allocated_amount = p.requested_amount if p.is_funded else 0.0
        store.update(p)
    _last_allocation = result
    ledger.record_allocation(result)
    return result


@app.post("/allocate", response_model=AllocationResult, tags=["allocation"])
def allocate(
    total_budget: float = Query(..., description="Fixed CSR budget in ₹"),
    strategy: str = Query("optimizer", pattern="^(optimizer|ranked|greedy)$"),
    max_per_region_ratio: Optional[float] = Query(
        None, gt=0, lt=1,
        description="Equity cap: max share of the budget any one region can take (e.g. 0.35)",
    ),
):
    return _run_allocation(total_budget, strategy, max_per_region_ratio)


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
# Pillar 5 — implementing partners & right-partner matching
# --------------------------------------------------------------------------- #
@app.get("/partners", response_model=List[PartnerOut], tags=["partners"])
def list_partners(sector: Optional[str] = None, region: Optional[str] = None):
    """Directory of implementing partners with their capability profiles."""
    items = partners_mod.store.load()
    if sector:
        items = [p for p in items
                 if sector.lower() in {s.lower() for s in p.sectors}]
    if region:
        items = [p for p in items
                 if region.lower() in {r.lower() for r in p.regions}]
    return [PartnerOut(**p.to_dict()) for p in items]


@app.post("/proposals/{proposal_id}/match", response_model=PartnerMatchResult,
          tags=["partners"])
def match_proposal_partners(proposal_id: int, top_n: int = Query(3, ge=1, le=10)):
    """Ranked implementing-partner shortlist for one proposal (Pillar 5)."""
    p = store.get(proposal_id)
    if not p:
        raise HTTPException(404, f"Proposal {proposal_id} not found.")
    return partners_mod.match_partners(p.to_dict(), top_n=top_n)


# --------------------------------------------------------------------------- #
# Pillar 6 — remaining-budget advisor
# --------------------------------------------------------------------------- #
@app.get("/allocate/remaining", response_model=BudgetSuggestion, tags=["allocation"])
def allocate_remaining():
    """Leftover-budget recommendation for the most recent allocation run."""
    if _last_allocation is None:
        raise HTTPException(404, "No allocation has been run yet.")
    return recommend_budget(_last_allocation)


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


@app.get("/districts/saturation", tags=["meta"])
def district_saturation():
    """Per-region funded vs requested totals + development-need index.

    Feeds the Equity Snapshot screen and, conceptually, the next cycle's
    concentration penalty (dossier Pillar 1).
    """
    from .geo import need_index

    rows: dict[str, dict] = {}
    for p in store.all():
        r = rows.setdefault(p.region, {
            "region": p.region, "need_index": need_index(p.region), "proposals": 0,
            "requested": 0.0, "funded_count": 0, "funded_amount": 0.0, "beneficiaries": 0,
        })
        r["proposals"] += 1
        r["requested"] += p.requested_amount
        r["beneficiaries"] += p.beneficiaries
        if p.is_funded:
            r["funded_count"] += 1
            r["funded_amount"] += p.allocated_amount
    for r in rows.values():
        r["requested"] = round(r["requested"], 2)
        r["funded_amount"] = round(r["funded_amount"], 2)
        r["funded_share"] = round(
            r["funded_amount"] / r["requested"], 3) if r["requested"] else 0.0
    return sorted(rows.values(), key=lambda r: r["requested"], reverse=True)


# --------------------------------------------------------------------------- #
# Pillar 4 — tamper-evident audit trail
# --------------------------------------------------------------------------- #
@app.get("/audit-log", tags=["audit"])
def audit_log(proposal_id: Optional[int] = None):
    """Hash-chained event history. Optional ?proposal_id= filter."""
    return ledger.history(proposal_id)


@app.get("/audit-log/verify", tags=["audit"])
def audit_log_verify():
    """Re-hash the whole chain and report whether it's intact."""
    return ledger.verify()


# --------------------------------------------------------------------------- #
# dataset provenance
# --------------------------------------------------------------------------- #
@app.get("/api/dataset", tags=["meta"])
def dataset_info():
    """Provenance + trusted-source list for the bundled proposal dataset."""
    info = dict(DATASET_INFO)
    info["loaded_rows"] = len(store)
    return info


@app.get("/dataset/sample_proposals.csv", tags=["meta"])
def dataset_download():
    path = Path(DATA_DIR) / "sample_proposals.csv"
    if not path.exists():
        raise HTTPException(404, "Dataset file not found.")
    return FileResponse(path, media_type="text/csv", filename="sample_proposals.csv")


# Run once at import so the app is demo-ready even without the lifespan hook
# (e.g. a plain ``TestClient(app)`` used outside a ``with`` block).
_bootstrap()


# --------------------------------------------------------------------------- #
# Serve the built frontend from this same process (one port for everything).
# Registered LAST so every API route above still wins; unknown paths fall
# through to the SPA's index.html.
# --------------------------------------------------------------------------- #
if FRONTEND_DIST.exists():
    _index = FRONTEND_DIST / "index.html"

    @app.get("/", include_in_schema=False)
    def _spa_index():
        return FileResponse(_index)

    app.mount(
        "/",
        StaticFiles(directory=str(FRONTEND_DIST), html=True),
        name="spa",
    )
else:
    @app.get("/", tags=["meta"])
    def root():
        return {
            "name": "CSR Helper API",
            "version": __version__,
            "docs": "/docs",
            "hint": "Run `npm run build` in ../frontend to serve the UI from here too.",
        }
