"""Pillar 4 — tamper-evident audit trail.

Every allocation decision and milestone event is appended as a hash-chained
entry: ``entry_hash = sha256(json(entry) + prev_hash)``. Change any past row and
every hash after it stops matching — ``verify()`` catches it. In-memory for the
demo; the shape promotes directly to an ``audit_log`` table.
"""
from __future__ import annotations

import hashlib
import json
import threading
import time
from typing import Any, Dict, List

_GENESIS = "0" * 64
_lock = threading.RLock()
_chain: List[Dict[str, Any]] = []


def _hash(entry: Dict[str, Any], prev_hash: str) -> str:
    payload = json.dumps(entry, sort_keys=True, default=str) + prev_hash
    return hashlib.sha256(payload.encode()).hexdigest()


def append(event: str, *, proposal_id: int | None = None, **fields: Any) -> Dict[str, Any]:
    with _lock:
        prev_hash = _chain[-1]["entry_hash"] if _chain else _GENESIS
        entry = {
            "seq": len(_chain),
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "event": event,
            "proposal_id": proposal_id,
            "detail": fields,
        }
        entry["prev_hash"] = prev_hash
        entry["entry_hash"] = _hash(
            {k: entry[k] for k in ("seq", "ts", "event", "proposal_id", "detail")},
            prev_hash,
        )
        _chain.append(entry)
        return entry


def record_allocation(result: Dict[str, Any]) -> None:
    append(
        "allocation_run",
        strategy=result.get("strategy"),
        solver=result.get("solver"),
        total_budget=result.get("total_budget"),
        spent=result.get("spent"),
        funded=len(result.get("funded") or []),
        rejected=len(result.get("rejected") or []),
    )
    for p in result.get("funded") or []:
        append(
            "proposal_funded",
            proposal_id=p.get("id"),
            ngo=p.get("ngo_name"),
            title=p.get("title"),
            amount=p.get("allocated_amount") or p.get("requested_amount"),
            region=p.get("region"),
            sector=p.get("sector"),
        )


def history(proposal_id: int | None = None) -> List[Dict[str, Any]]:
    with _lock:
        if proposal_id is None:
            return list(_chain)
        return [e for e in _chain if e["proposal_id"] == proposal_id]


def verify() -> Dict[str, Any]:
    with _lock:
        prev = _GENESIS
        for e in _chain:
            core = {k: e[k] for k in ("seq", "ts", "event", "proposal_id", "detail")}
            if _hash(core, prev) != e["entry_hash"] or e["prev_hash"] != prev:
                return {"valid": False, "broken_at": e["seq"], "entries": len(_chain)}
            prev = e["entry_hash"]
        return {"valid": True, "broken_at": None, "entries": len(_chain)}


def clear() -> None:
    with _lock:
        _chain.clear()
