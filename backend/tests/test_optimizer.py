"""Test the optimizer IN ISOLATION before it is wired to anything (plan section 4.2)."""
from __future__ import annotations

from app.optimizer import allocate_budget, compare_strategies

FAKE = [
    {"id": 1, "title": "A", "requested_amount": 100_000, "final_score": 8.0, "beneficiaries": 800},
    {"id": 2, "title": "B", "requested_amount": 250_000, "final_score": 7.5, "beneficiaries": 2000},
    {"id": 3, "title": "C", "requested_amount": 300_000, "final_score": 9.0, "beneficiaries": 1500},
    {"id": 4, "title": "D", "requested_amount": 150_000, "final_score": 6.0, "beneficiaries": 600},
    {"id": 5, "title": "E", "requested_amount": 500_000, "final_score": 9.5, "beneficiaries": 5000},
    {"id": 6, "title": "F", "requested_amount": 120_000, "final_score": 5.0, "beneficiaries": 400},
]


def test_respects_budget():
    res = allocate_budget(FAKE, 500_000)
    assert res["spent"] <= 500_000 + 1e-6
    assert res["remaining"] >= -1e-6
    assert len(res["funded"]) >= 1


def test_optimizer_beats_or_matches_ranked():
    budget = 550_000
    opt = allocate_budget(FAKE, budget, strategy="optimizer")
    ranked = allocate_budget(FAKE, budget, strategy="ranked")
    assert opt["total_score"] >= ranked["total_score"] - 1e-6
    assert opt["spent"] <= budget + 1e-6


def test_zero_budget_is_safe():
    res = allocate_budget(FAKE, 0)
    assert res["funded"] == []
    assert res["spent"] == 0
    assert any("0" in n or "₹0" in n for n in res["notes"])


def test_empty_proposals_is_safe():
    res = allocate_budget([], 100_000)
    assert res["funded"] == [] and res["rejected"] == []


def test_negative_amount_is_skipped_not_crashed():
    rows = FAKE + [{"id": 99, "title": "BAD", "requested_amount": -5, "final_score": 10, "beneficiaries": 1}]
    res = allocate_budget(rows, 400_000)
    titles = {p["title"] for p in res["funded"] + res["rejected"]}
    assert "BAD" not in titles
    assert any("BAD" in n for n in res["notes"])


def test_huge_budget_funds_everything():
    res = allocate_budget(FAKE, 10_000_000)
    assert len(res["funded"]) == len(FAKE)


def test_compare_has_headline():
    cmp = compare_strategies(FAKE, 450_000)
    assert "optimizer" in cmp and "ranked" in cmp
    assert isinstance(cmp["headline"], str) and cmp["headline"]


REGIONAL = [
    {"id": 1, "title": "MH-1", "region": "Maharashtra", "requested_amount": 400_000, "final_score": 9.0, "beneficiaries": 900},
    {"id": 2, "title": "MH-2", "region": "Maharashtra", "requested_amount": 400_000, "final_score": 8.8, "beneficiaries": 800},
    {"id": 3, "title": "MH-3", "region": "Maharashtra", "requested_amount": 400_000, "final_score": 8.6, "beneficiaries": 700},
    {"id": 4, "title": "BR-1", "region": "Bihar", "requested_amount": 400_000, "final_score": 7.0, "beneficiaries": 1200},
    {"id": 5, "title": "OD-1", "region": "Odisha", "requested_amount": 400_000, "final_score": 6.8, "beneficiaries": 1100},
]


def test_equity_cap_forces_geographic_spread():
    budget = 1_200_000  # room for 3 proposals
    free = allocate_budget(REGIONAL, budget, strategy="optimizer")
    capped = allocate_budget(REGIONAL, budget, strategy="optimizer", max_per_region_ratio=0.34)

    def region_spend(res):
        by = {}
        for p in res["funded"]:
            by[p["region"]] = by.get(p["region"], 0) + p["requested_amount"]
        return by

    # unconstrained: all three Maharashtra proposals (highest scores)
    assert region_spend(free).get("Maharashtra", 0) == 1_200_000
    # capped at 34% of 1.2M = 408k -> only one Maharashtra proposal fits
    assert region_spend(capped)["Maharashtra"] <= 408_000 + 1e-6
    assert len(region_spend(capped)) >= 3
    assert capped["spent"] <= budget + 1e-6
    assert any("Equity cap" in n for n in capped["notes"])
