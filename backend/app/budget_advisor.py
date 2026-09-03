"""Pillar 6 — Remaining-budget advisor.

An ILP rarely spends a budget to the last rupee: indivisible proposals leave a
remainder. What happens to that remainder is itself a decision, and today it is
nobody's job. Left unaddressed it sits idle or gets allocated informally, off any
record — quietly undermining the transparency the rest of the system provides.

After each allocation run, ``leftover = total_budget - spent`` feeds a small
three-branch decision, run automatically and shown to the manager as a
recommendation, never an auto-commit:

    1. does leftover >= the next-best unfunded proposal's ask?   -> fund it
    2. does leftover cover >= 70% of a near-miss proposal?        -> partial-fund offer
    3. otherwise                                                  -> flagged roll-over

Every path produces a ``budget_reallocation_suggestions`` row so "what did we do
with the money we didn't spend" has a recorded answer in every cycle.
"""
from __future__ import annotations

from typing import Any, Dict, List

PARTIAL_FUND_THRESHOLD = 0.70


def _fmt(amount: float) -> str:
    return f"₹{amount:,.0f}"


def recommend(allocation: Dict[str, Any] | None) -> Dict[str, Any]:
    """Return a leftover-budget recommendation for a completed allocation run."""
    if not allocation:
        return {
            "type": "none",
            "leftover": 0.0,
            "target_proposal_id": None,
            "target_title": None,
            "coverage": None,
            "rationale": "No allocation has been run yet.",
            "candidates_considered": 0,
        }

    total_budget = float(allocation.get("total_budget") or 0.0)
    spent = float(allocation.get("spent") or 0.0)
    leftover = round(total_budget - spent, 2)
    rejected: List[Dict[str, Any]] = list(allocation.get("rejected") or [])

    # rank near-misses by impact-per-rupee so the leftover buys the most impact
    def _efficiency(p: Dict[str, Any]) -> float:
        ask = float(p.get("requested_amount") or 0.0) or 1.0
        return float(p.get("final_score") or 0.0) / ask

    ranked = sorted(rejected, key=_efficiency, reverse=True)

    base = {
        "strategy": allocation.get("strategy"),
        "total_budget": round(total_budget, 2),
        "spent": round(spent, 2),
        "leftover": leftover,
        "candidates_considered": len(ranked),
    }

    if leftover <= 0:
        return {
            **base,
            "type": "fully_utilised",
            "target_proposal_id": None,
            "target_title": None,
            "coverage": None,
            "rationale": "Budget fully utilised — no leftover to reallocate.",
        }

    # branch 1 — next-best fit fully covered
    for p in ranked:
        ask = float(p.get("requested_amount") or 0.0)
        if 0 < ask <= leftover:
            return {
                **base,
                "type": "next_best",
                "target_proposal_id": p.get("id"),
                "target_title": p.get("title"),
                "target_ngo": p.get("ngo_name"),
                "target_ask": round(ask, 2),
                "coverage": 1.0,
                "rationale": (
                    f"{p.get('title')} ({p.get('ngo_name')}) fits fully within the "
                    f"{_fmt(leftover)} remaining — fund it and close the run."
                ),
            }

    # branch 2 — partial funding of a near-miss
    for p in ranked:
        ask = float(p.get("requested_amount") or 0.0)
        if ask > 0 and leftover >= PARTIAL_FUND_THRESHOLD * ask:
            coverage = round(leftover / ask, 3)
            return {
                **base,
                "type": "partial_fund",
                "target_proposal_id": p.get("id"),
                "target_title": p.get("title"),
                "target_ngo": p.get("ngo_name"),
                "target_ask": round(ask, 2),
                "coverage": coverage,
                "rationale": (
                    f"{_fmt(leftover)} covers {coverage:.0%} of {p.get('title')} "
                    f"({p.get('ngo_name')}) — offer a scoped partial grant for the "
                    f"deliverables that fit."
                ),
            }

    # branch 3 — roll over with a recorded priority flag
    return {
        **base,
        "type": "rollover",
        "target_proposal_id": None,
        "target_title": None,
        "coverage": None,
        "rationale": (
            f"No unfunded proposal fits the {_fmt(leftover)} remaining — roll over "
            f"and priority-flag it for the next cycle. Never silently absorbed."
        ),
    }
