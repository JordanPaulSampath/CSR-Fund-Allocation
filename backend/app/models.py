"""Domain model + in-memory store.

The plan (section 3.2, "Practical note for the demo") is explicit: use an
in-memory Python structure, not Postgres. Judges cannot tell the difference
in a live demo and standing up a DB costs hours you do not have.

``ProposalStore`` is a tiny thread-safe repository so the rest of the code
never touches a raw list. Swapping in SQLite later is a change to this file
only.
"""
from __future__ import annotations

import threading
from dataclasses import asdict, dataclass, field
from typing import Dict, Iterable, List, Optional


@dataclass
class Proposal:
    id: int
    ngo_name: str
    title: str
    sector: str
    region: str
    requested_amount: float
    beneficiaries: int
    # scored fields (filled by scoring.score_proposal)
    impact_potential: float = 0.0
    cost_per_beneficiary: float = 0.0
    feasibility: float = 0.0
    final_score: float = 0.0
    score_breakdown: Dict[str, float] = field(default_factory=dict)
    # allocation fields (filled by optimizer.allocate_budget)
    allocated_amount: float = 0.0
    is_funded: bool = False

    def to_dict(self) -> dict:
        return asdict(self)


class ProposalStore:
    def __init__(self) -> None:
        self._items: Dict[int, Proposal] = {}
        self._next_id = 1
        self._lock = threading.RLock()

    def add(self, proposal: Proposal) -> Proposal:
        with self._lock:
            proposal.id = self._next_id
            self._items[proposal.id] = proposal
            self._next_id += 1
            return proposal

    def bulk_add(self, proposals: Iterable[Proposal]) -> List[Proposal]:
        return [self.add(p) for p in proposals]

    def get(self, proposal_id: int) -> Optional[Proposal]:
        with self._lock:
            return self._items.get(proposal_id)

    def update(self, proposal: Proposal) -> Proposal:
        with self._lock:
            self._items[proposal.id] = proposal
            return proposal

    def all(self) -> List[Proposal]:
        with self._lock:
            return sorted(self._items.values(), key=lambda p: p.id)

    def delete(self, proposal_id: int) -> bool:
        with self._lock:
            return self._items.pop(proposal_id, None) is not None

    def clear(self) -> None:
        with self._lock:
            self._items.clear()
            self._next_id = 1

    def __len__(self) -> int:
        with self._lock:
            return len(self._items)


# single process-wide store
store = ProposalStore()
