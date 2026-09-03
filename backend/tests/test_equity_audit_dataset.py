"""Equity snapshot, tamper-evident audit trail, dataset provenance, extra logins."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app import ledger
from app.main import app
from app.models import store

client = TestClient(app)


@pytest.fixture(autouse=True)
def _clean():
    store.clear()
    ledger.clear()
    yield
    store.clear()
    ledger.clear()


def _auth(u="csr_manager", p="saarthi2026") -> dict:
    r = client.post("/auth/login", json={"username": u, "password": p})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.mark.parametrize("user,pw,role,budget", [
    ("csr_manager", "saarthi2026", "CSR Manager", 5_000_000),
    ("demo", "demo12345", "CSR Manager", 2_500_000),
    ("analyst", "analyst2026", "CSR Analyst", 1_000_000),
    ("program_officer", "program2026", "Program Officer", 3_500_000),
    ("cfo", "finance2026", "Finance Head", 25_000_000),
    ("auditor", "auditor2026", "Compliance Auditor", 5_000_000),
    ("board", "board2026", "Board Member", 50_000_000),
    ("regional_lead", "region2026", "Regional Lead", 7_500_000),
    ("foundation_head", "foundation26", "Foundation Head", 100_000_000),
    ("enterprise", "enterprise26", "Group CSR Head", 500_000_000),
])
def test_all_seeded_logins_work(user, pw, role, budget):
    r = client.post("/auth/login", json={"username": user, "password": pw})
    assert r.status_code == 200
    body = r.json()
    assert body["role"] == role
    assert body["default_budget"] == budget


def test_district_saturation_shape():
    h = _auth()
    client.post("/proposals/load-samples", headers=h)
    client.post("/allocate?total_budget=5000000", headers=h)
    rows = client.get("/districts/saturation").json()
    assert rows and rows == sorted(rows, key=lambda r: r["requested"], reverse=True)
    top = rows[0]
    assert {"region", "need_index", "requested", "funded_amount", "funded_share"} <= set(top)
    assert 0 <= top["funded_share"] <= 1


def test_audit_log_grows_and_verifies():
    h = _auth()
    client.post("/proposals/load-samples", headers=h)
    assert client.get("/audit-log").json() == []
    client.post("/allocate?total_budget=4000000", headers=h)
    log = client.get("/audit-log").json()
    assert len(log) >= 2
    assert log[0]["event"] == "allocation_run"
    assert log[0]["prev_hash"] == "0" * 64
    v = client.get("/audit-log/verify").json()
    assert v["valid"] is True and v["entries"] == len(log)


def test_audit_chain_detects_tampering():
    h = _auth()
    client.post("/proposals/load-samples", headers=h)
    client.post("/allocate?total_budget=4000000", headers=h)
    ledger._chain[1]["detail"]["amount"] = 999999999  # tamper in place
    v = client.get("/audit-log/verify").json()
    assert v["valid"] is False and v["broken_at"] == 1


def test_dataset_info_and_download():
    info = client.get("/api/dataset").json()
    assert info["rows"] == 220
    assert len(info["sources"]) >= 6
    assert all(s["url"].startswith("http") for s in info["sources"])
    csv = client.get("/dataset/sample_proposals.csv")
    assert csv.status_code == 200
    assert csv.headers["content-type"].startswith("text/csv")
    assert csv.text.splitlines()[0].startswith("ngo_name,title,sector,region")
