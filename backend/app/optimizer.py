"""Budget allocation — Saarthi's core differentiator.

``strategy="optimizer"`` solves a 0/1 knapsack ILP: pick the subset of
proposals that maximises total weighted score subject to a hard budget cap.
A ranked list cannot do this — it overshoots the budget or leaves money
unused. That contrast is the demo's money shot (plan section 6.2, 3:30-4:15).

Robustness matters more than elegance here: if PuLP / the CBC solver is
missing or errors, we fall back to a greedy knapsack so the live demo never
dies. The response always reports which ``solver`` actually ran.
"""
from __future__ import annotations

from typing import Any, Dict, List, Sequence

Number = float


def _as_rows(proposals: Sequence[Any]) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for p in proposals:
        d = p.to_dict() if hasattr(p, "to_dict") else dict(p)
        rows.append(d)
    return rows


def _sanitise(rows: List[Dict[str, Any]]) -> tuple[List[Dict[str, Any]], List[str]]:
    """Drop rows that can never be funded so a bad input can't crash allocation."""
    notes: List[str] = []
    clean: List[Dict[str, Any]] = []
    for r in rows:
        amount = float(r.get("requested_amount") or 0)
        if amount <= 0:
            notes.append(f"Skipped '{r.get('title')}' - requested_amount must be > 0.")
            continue
        r["requested_amount"] = amount
        r["final_score"] = float(r.get("final_score") or 0)
        r["beneficiaries"] = int(r.get("beneficiaries") or 0)
        clean.append(r)
    return clean, notes


def _package(strategy: str, solver: str, rows: List[Dict[str, Any]],
             chosen: set, total_budget: float, notes: List[str]) -> Dict[str, Any]:
    funded, rejected, spent, score, benef = [], [], 0.0, 0.0, 0
    for r in rows:
        r = dict(r)
        if r.get("_key") in chosen:
            r["is_funded"] = True
            r["allocated_amount"] = r["requested_amount"]
            spent += r["requested_amount"]
            score += r["final_score"]
            benef += r["beneficiaries"]
            funded.append(r)
        else:
            r["is_funded"] = False
            r["allocated_amount"] = 0.0
            rejected.append(r)
    for r in funded + rejected:
        r.pop("_key", None)
    funded.sort(key=lambda r: r["final_score"], reverse=True)
    rejected.sort(key=lambda r: r["final_score"], reverse=True)
    return {
        "strategy": strategy,
        "solver": solver,
        "total_budget": round(total_budget, 2),
        "spent": round(spent, 2),
        "remaining": round(total_budget - spent, 2),
        "funded": funded,
        "rejected": rejected,
        "total_score": round(score, 2),
        "total_beneficiaries": benef,
        "notes": notes,
    }


def _greedy_knapsack(rows: List[Dict[str, Any]], total_budget: float) -> set:
    """Value/cost ratio greedy — decent knapsack heuristic, always available."""
    order = sorted(
        rows,
        key=lambda r: (r["final_score"] / r["requested_amount"], r["final_score"]),
        reverse=True,
    )
    chosen: set = set()
    remaining = total_budget
    for r in order:
        if r["requested_amount"] <= remaining + 1e-6:
            chosen.add(r["_key"])
            remaining -= r["requested_amount"]
    return chosen


def _ranked_fill(rows: List[Dict[str, Any]], total_budget: float) -> set:
    """The naive baseline we compare against: fund straight down the score
    ranking while budget allows. Suboptimal on purpose."""
    order = sorted(rows, key=lambda r: r["final_score"], reverse=True)
    chosen: set = set()
    remaining = total_budget
    for r in order:
        if r["requested_amount"] <= remaining + 1e-6:
            chosen.add(r["_key"])
            remaining -= r["requested_amount"]
    return chosen


def _ilp(rows: List[Dict[str, Any]], total_budget: float) -> tuple[set, str]:
    try:
        from pulp import (LpBinary, LpMaximize, LpProblem, LpVariable,
                          PULP_CBC_CMD, lpSum, value)
    except Exception:  # pragma: no cover - only when pulp missing
        return _greedy_knapsack(rows, total_budget), "greedy-fallback (pulp unavailable)"

    try:
        prob = LpProblem("Saarthi_Allocation", LpMaximize)
        x = {r["_key"]: LpVariable(f"x_{i}", cat=LpBinary) for i, r in enumerate(rows)}

        max_benef = max((r["beneficiaries"] for r in rows), default=1) or 1
        # primary: total weighted score. tiny tie-break: prefer more reach.
        prob += lpSum(
            x[r["_key"]] * (r["final_score"] + 0.001 * r["beneficiaries"] / max_benef)
            for r in rows
        )
        prob += lpSum(x[r["_key"]] * r["requested_amount"] for r in rows) <= total_budget

        status = prob.solve(PULP_CBC_CMD(msg=False))
        chosen = {k for k, var in x.items() if var.value() and value(var) >= 0.5}
        if not chosen and total_budget > 0 and any(
            r["requested_amount"] <= total_budget for r in rows
        ):
            # solver returned nothing useful — don't ship an empty demo
            return _greedy_knapsack(rows, total_budget), "greedy-fallback (solver empty)"
        return chosen, "pulp-cbc (ILP)"
    except Exception:
        return _greedy_knapsack(rows, total_budget), "greedy-fallback (solver error)"


def allocate_budget(
    proposals: Sequence[Any],
    total_budget: float,
    strategy: str = "optimizer",
) -> Dict[str, Any]:
    total_budget = max(float(total_budget or 0), 0.0)
    rows = _as_rows(proposals)
    rows, notes = _sanitise(rows)
    for i, r in enumerate(rows):
        r["_key"] = i

    if not rows:
        return _package(strategy, "none", [], set(), total_budget,
                        notes + ["No fundable proposals available."])
    if total_budget <= 0:
        return _package(strategy, "none", rows, set(), total_budget,
                        notes + ["Budget is 0 - nothing can be funded."])

    if strategy == "ranked":
        chosen, solver = _ranked_fill(rows, total_budget), "ranked-list (baseline)"
    elif strategy == "greedy":
        chosen, solver = _greedy_knapsack(rows, total_budget), "greedy-knapsack"
    else:
        strategy = "optimizer"
        chosen, solver = _ilp(rows, total_budget)

    result = _package(strategy, solver, rows, chosen, total_budget, notes)
    for r in result["funded"] + result["rejected"]:
        r.pop("_key", None)
    return result


def compare_strategies(proposals: Sequence[Any], total_budget: float) -> Dict[str, Any]:
    opt = allocate_budget(proposals, total_budget, strategy="optimizer")
    ranked = allocate_budget(proposals, total_budget, strategy="ranked")
    score_gain = round(opt["total_score"] - ranked["total_score"], 2)
    benef_gain = opt["total_beneficiaries"] - ranked["total_beneficiaries"]
    budget_used = round(opt["spent"] - ranked["spent"], 2)

    if score_gain > 0 or benef_gain > 0:
        headline = (
            f"The optimizer funds {opt['total_beneficiaries']:,} beneficiaries "
            f"({benef_gain:+,} vs a ranked list) and captures {score_gain:+.2f} "
            f"more total impact score for the same Rs.{total_budget:,.0f} budget."
        )
    else:
        headline = (
            "On this dataset the ranked list happens to match the optimizer — "
            "try a tighter budget to see them diverge."
        )
    return {
        "optimizer": opt,
        "ranked": ranked,
        "score_gain": score_gain,
        "beneficiary_gain": benef_gain,
        "budget_better_used": budget_used,
        "headline": headline,
    }
