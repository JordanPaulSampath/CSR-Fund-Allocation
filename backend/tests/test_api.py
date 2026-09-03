"""End-to-end API tests — the full score -> allocate flow the demo runs."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models import store

client = TestClient(app)


@pytest.fixture(autouse=True)
def _clean():
    store.clear()
    yield
    store.clear()


def _auth() -> dict:
    r = client.post("/auth/login", json={"username": "csr_manager", "password": "saarthi2026"})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_login_rejects_bad_password():
    r = client.post("/auth/login", json={"username": "csr_manager", "password": "nope"})
    assert r.status_code == 401


def test_add_requires_auth():
    r = client.post("/proposals", json={
        "ngo_name": "X", "title": "T", "sector": "health", "region": "Bihar",
        "requested_amount": 100000, "beneficiaries": 500,
    })
    assert r.status_code == 401


def test_full_flow():
    h = _auth()
    created = client.post("/proposals/load-samples", headers=h)
    assert created.status_code == 200
    n = len(created.json())
    assert n > 0

    lst = client.get("/proposals")
    assert len(lst.json()) == n
    assert all(p["final_score"] > 0 for p in lst.json())

    alloc = client.post("/allocate?total_budget=1500000", headers=h)
    assert alloc.status_code == 200
    body = alloc.json()
    assert body["spent"] <= 1500000 + 1e-6
    assert len(body["funded"]) + len(body["rejected"]) == n

    # proposals now reflect allocation
    funded_now = client.get("/proposals?funded=true").json()
    assert len(funded_now) == len(body["funded"])

    last = client.get("/allocate/last")
    assert last.status_code == 200


def test_bad_proposal_rejected_by_validation():
    h = _auth()
    r = client.post("/proposals", headers=h, json={
        "ngo_name": "X", "title": "T", "sector": "health", "region": "Bihar",
        "requested_amount": 0, "beneficiaries": 500,
    })
    assert r.status_code == 422


def test_allocate_without_proposals_is_clean_400():
    h = _auth()
    r = client.post("/allocate?total_budget=100000", headers=h)
    assert r.status_code == 400


def test_weight_change_rescoreds():
    h = _auth()
    client.post("/proposals/load-samples", headers=h)
    before = client.get("/proposals").json()[0]["final_score"]
    client.put("/scoring/weights", headers=h, json={"impact": 0.9, "cost_efficiency": 0.05, "feasibility": 0.05})
    after = client.get("/proposals").json()[0]["final_score"]
    assert before != after
    client.post("/scoring/reset-weights", headers=h)


def test_compare_endpoint():
    h = _auth()
    client.post("/proposals/load-samples", headers=h)
    r = client.post("/allocate/compare?total_budget=800000", headers=h)
    assert r.status_code == 200
    assert "headline" in r.json()
