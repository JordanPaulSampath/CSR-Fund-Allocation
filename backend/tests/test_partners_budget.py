"""Pillar 5 (implementing-partner matching) + Pillar 6 (remaining-budget advisor)."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import app.main as main
from app.budget_advisor import recommend
from app.main import app
from app.models import store
from app.partners import match_partners

client = TestClient(app)


@pytest.fixture(autouse=True)
def _clean():
    store.clear()
    main._last_allocation = None
    yield
    store.clear()
    main._last_allocation = None


def _auth() -> dict:
    r = client.post("/auth/login", json={"username": "csr_manager", "password": "saarthi2026"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


# --------------------------------------------------------------------------- #
# Pillar 5
# --------------------------------------------------------------------------- #
def test_partners_directory_loads():
    r = client.get("/partners")
    assert r.status_code == 200
    body = r.json()
    assert len(body) >= 10
    assert {"name", "sectors", "regions", "track_record"} <= set(body[0])


def test_partners_directory_filters_by_sector():
    r = client.get("/partners?sector=education")
    assert r.status_code == 200
    assert all("education" in [s.lower() for s in p["sectors"]] for p in r.json())


def test_match_ranks_sector_and_region_fit_highest():
    prop = {
        "id": 1, "title": "Girls STEM", "sector": "education",
        "region": "Maharashtra", "beneficiaries": 2000, "requested_amount": 700000,
    }
    result = match_partners(prop, top_n=3)
    shortlist = result["shortlist"]
    assert len(shortlist) == 3
    # descending by fit
    assert shortlist == sorted(shortlist, key=lambda c: c["fit"], reverse=True)
    top = shortlist[0]
    assert top["components"]["sector_match"] == 1.0
    assert top["components"]["region_presence"] == 1.0


def test_match_flags_co_implementation_when_scale_exceeds_capacity():
    prop = {
        "id": 2, "title": "Mass Watershed", "sector": "water and sanitation",
        "region": "Odisha", "beneficiaries": 9000, "requested_amount": 2000000,
    }
    result = match_partners(prop, top_n=3)
    assert any(c["co_implementation_suggested"] for c in result["shortlist"])


def test_match_endpoint_requires_existing_proposal():
    h = _auth()
    client.post("/proposals/load-samples", headers=h)
    pid = client.get("/proposals").json()[0]["id"]
    r = client.post(f"/proposals/{pid}/match")
    assert r.status_code == 200
    assert r.json()["shortlist"]

    assert client.post("/proposals/999999/match").status_code == 404


# --------------------------------------------------------------------------- #
# Pillar 6
# --------------------------------------------------------------------------- #
def test_recommend_next_best_when_leftover_covers_an_ask():
    run = {
        "strategy": "optimizer", "total_budget": 1_000_000, "spent": 880_000,
        "rejected": [
            {"id": 5, "title": "Wells", "ngo_name": "GreenRoots", "requested_amount": 110_000, "final_score": 6.4},
            {"id": 6, "title": "Camp", "ngo_name": "Sahyog", "requested_amount": 500_000, "final_score": 8.1},
        ],
    }
    out = recommend(run)
    assert out["type"] == "next_best"
    assert out["target_proposal_id"] == 5
    assert out["leftover"] == 120_000


def test_recommend_partial_fund_between_70pct_and_full():
    run = {
        "strategy": "optimizer", "total_budget": 1_000_000, "spent": 900_000,
        "rejected": [{"id": 6, "title": "Camp", "ngo_name": "X", "requested_amount": 120_000, "final_score": 8.1}],
    }
    out = recommend(run)
    assert out["type"] == "partial_fund"
    assert 0.7 <= out["coverage"] < 1.0


def test_recommend_rollover_when_nothing_fits():
    run = {
        "strategy": "optimizer", "total_budget": 1_000_000, "spent": 995_000,
        "rejected": [{"id": 6, "title": "Camp", "ngo_name": "X", "requested_amount": 500_000, "final_score": 8.1}],
    }
    assert recommend(run)["type"] == "rollover"


def test_remaining_endpoint_404_before_any_allocation():
    assert client.get("/allocate/remaining").status_code == 404


def test_remaining_endpoint_after_allocation():
    h = _auth()
    client.post("/proposals/load-samples", headers=h)
    client.post("/allocate?total_budget=1200000", headers=h)
    r = client.get("/allocate/remaining")
    assert r.status_code == 200
    assert r.json()["type"] in {
        "next_best", "partial_fund", "rollover", "fully_utilised",
    }
