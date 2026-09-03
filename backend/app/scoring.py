"""Proposal scoring.

Weights come from Non-Tech #2's ``scoring_weights.yaml`` (see config.py).
Every proposal gets a 0-10ish ``final_score`` plus a ``score_breakdown`` so
the UI can show *why* something scored the way it did — that transparency is
half the pitch.
"""
from __future__ import annotations

from typing import Dict

from .config import load_weights
from .models import Proposal

# Tunable reference points. These are deliberately simple and explainable —
# a judge can follow the arithmetic on stage.
IMPACT_BENEFICIARY_FULL_MARK = 4000      # beneficiaries that earn a 10/10 reach score
COST_REFERENCE_PER_BENEFICIARY = 1500.0  # ₹/beneficiary considered "efficient"


def _clamp(value: float, low: float = 0.0, high: float = 10.0) -> float:
    return max(low, min(high, value))


def compute_scores(
    requested_amount: float,
    beneficiaries: int,
    weights: Dict[str, float] | None = None,
) -> Dict[str, float]:
    weights = weights or load_weights()
    beneficiaries = max(int(beneficiaries), 1)
    requested_amount = max(float(requested_amount), 1.0)

    cost_per_beneficiary = requested_amount / beneficiaries

    # Reach / impact: more beneficiaries -> higher, saturating at the full mark.
    impact = _clamp(10.0 * beneficiaries / IMPACT_BENEFICIARY_FULL_MARK)

    # Cost efficiency: cheaper per beneficiary -> higher. Smooth 0..10 curve.
    cost_efficiency = _clamp(
        10.0 * COST_REFERENCE_PER_BENEFICIARY
        / (COST_REFERENCE_PER_BENEFICIARY + cost_per_beneficiary)
        * 2.0
    )

    # Feasibility: smaller asks are easier to execute; large asks carry risk.
    # 7.0 baseline, nudged by ticket size. Refine with QA signal later.
    feasibility = _clamp(7.0 + (2.0 if requested_amount < 500_000 else 0.0)
                         - (2.0 if requested_amount > 3_000_000 else 0.0))

    final = (
        weights["impact"] * impact
        + weights["cost_efficiency"] * cost_efficiency
        + weights["feasibility"] * feasibility
    )

    return {
        "impact_potential": round(impact, 2),
        "cost_per_beneficiary": round(cost_per_beneficiary, 2),
        "cost_efficiency": round(cost_efficiency, 2),
        "feasibility": round(feasibility, 2),
        "final_score": round(final, 2),
    }


def score_proposal(proposal: Proposal, weights: Dict[str, float] | None = None) -> Proposal:
    weights = weights or load_weights()
    s = compute_scores(proposal.requested_amount, proposal.beneficiaries, weights)
    proposal.impact_potential = s["impact_potential"]
    proposal.cost_per_beneficiary = s["cost_per_beneficiary"]
    proposal.feasibility = s["feasibility"]
    proposal.final_score = s["final_score"]
    proposal.score_breakdown = {
        "impact": s["impact_potential"],
        "cost_efficiency": s["cost_efficiency"],
        "feasibility": s["feasibility"],
        "weight_impact": weights["impact"],
        "weight_cost_efficiency": weights["cost_efficiency"],
        "weight_feasibility": weights["feasibility"],
    }
    return proposal
