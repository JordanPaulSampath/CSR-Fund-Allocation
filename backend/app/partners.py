"""Pillar 5 — Right-partner matching (implementing partners).

A proposal can score well and still be undeliverable: the NGO that wrote it may
lack the geographic presence, sector depth, or capacity headroom the ask implies.
Scoring the *idea* and finding the *implementer* are two different questions.

Each proposal is reduced to a small need-vector (sector, region, requested scale).
Every implementing partner in the pool carries a capability profile — sectors
served, regions active in, average past project scale, and a delivery
track-record score. A weighted fit score ranks candidates:

    fit(proposal, partner) =
        0.35 * sector_match  +  0.25 * region_presence
      + 0.20 * capacity_headroom  +  0.20 * track_record

The shortlist is advisory only — shown to the CSR Manager alongside the funding
decision, never an automatic reassignment. First cycle has no track record, so a
new partner's term defaults to a neutral 0.5 and the badge reads
"new partner, unscored" rather than silently zeroing it out.
"""
from __future__ import annotations

import csv
import threading
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from .config import DATA_DIR

PARTNERS_CSV_PATH = Path(DATA_DIR) / "ngo_partners.csv"

# fit-score weights — mirror the formula in the dossier (Pillar 5, p.11)
FIT_WEIGHTS = {
    "sector_match": 0.35,
    "region_presence": 0.25,
    "capacity_headroom": 0.20,
    "track_record": 0.20,
}
NEUTRAL_TRACK_RECORD = 0.5


@dataclass
class Partner:
    id: int
    name: str
    sectors: List[str] = field(default_factory=list)
    regions: List[str] = field(default_factory=list)
    avg_project_scale: int = 0          # avg beneficiaries per past project
    track_record: float = NEUTRAL_TRACK_RECORD  # 0-1, on-time milestone rate
    cycles_completed: int = 0
    contact: str = ""
    registration_no: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


class PartnerStore:
    def __init__(self) -> None:
        self._items: Dict[int, Partner] = {}
        self._lock = threading.RLock()
        self._loaded = False

    def _split(self, raw: str) -> List[str]:
        return [x.strip() for x in (raw or "").replace(",", ";").split(";") if x.strip()]

    def load(self, *, force: bool = False) -> List[Partner]:
        with self._lock:
            if self._loaded and not force:
                return self.all()
            self._items.clear()
            if not PARTNERS_CSV_PATH.exists():
                self._loaded = True
                return []
            with PARTNERS_CSV_PATH.open(encoding="utf-8-sig", newline="") as fh:
                for i, row in enumerate(csv.DictReader(fh), start=1):
                    self._items[i] = Partner(
                        id=i,
                        name=(row.get("name") or "").strip(),
                        sectors=self._split(row.get("sectors", "")),
                        regions=self._split(row.get("regions", "")),
                        avg_project_scale=int(float(row.get("avg_project_scale") or 0)),
                        track_record=float(row.get("track_record") or NEUTRAL_TRACK_RECORD),
                        cycles_completed=int(float(row.get("cycles_completed") or 0)),
                        contact=(row.get("contact") or "").strip(),
                        registration_no=(row.get("registration_no") or "").strip(),
                    )
            self._loaded = True
            return self.all()

    def all(self) -> List[Partner]:
        with self._lock:
            return sorted(self._items.values(), key=lambda p: p.id)

    def get(self, partner_id: int) -> Optional[Partner]:
        with self._lock:
            return self._items.get(partner_id)

    def __len__(self) -> int:
        with self._lock:
            return len(self._items)


store = PartnerStore()


# --------------------------------------------------------------------------- #
# fit scoring
# --------------------------------------------------------------------------- #
def _norm(s: str) -> str:
    return (s or "").strip().lower()


def _fit_components(proposal: Dict[str, Any], partner: Partner) -> Dict[str, float]:
    p_sector = _norm(proposal.get("sector"))
    p_region = _norm(proposal.get("region"))
    beneficiaries = max(int(proposal.get("beneficiaries") or 1), 1)

    sector_match = 1.0 if p_sector in {_norm(s) for s in partner.sectors} else 0.0
    region_presence = 1.0 if p_region in {_norm(r) for r in partner.regions} else 0.0
    capacity_headroom = min(1.0, partner.avg_project_scale / beneficiaries)
    track_record = (
        partner.track_record if partner.cycles_completed > 0 else NEUTRAL_TRACK_RECORD
    )
    return {
        "sector_match": round(sector_match, 3),
        "region_presence": round(region_presence, 3),
        "capacity_headroom": round(capacity_headroom, 3),
        "track_record": round(track_record, 3),
    }


def fit_score(proposal: Dict[str, Any], partner: Partner) -> float:
    c = _fit_components(proposal, partner)
    total = sum(FIT_WEIGHTS[k] * c[k] for k in FIT_WEIGHTS)
    return round(total, 3)


def match_partners(
    proposal: Dict[str, Any], top_n: int = 3
) -> Dict[str, Any]:
    """Return a ranked implementing-partner shortlist for one proposal."""
    pool = store.load()
    beneficiaries = max(int(proposal.get("beneficiaries") or 1), 1)

    ranked = sorted(pool, key=lambda pt: fit_score(proposal, pt), reverse=True)
    shortlist: List[Dict[str, Any]] = []
    for partner in ranked[: max(top_n, 0)]:
        components = _fit_components(proposal, partner)
        fit = round(sum(FIT_WEIGHTS[k] * components[k] for k in FIT_WEIGHTS), 3)
        co_implementation = partner.avg_project_scale < beneficiaries * 0.5
        unscored = partner.cycles_completed == 0
        reasons: List[str] = []
        if components["sector_match"]:
            reasons.append(f"works in {proposal.get('sector')}")
        if components["region_presence"]:
            reasons.append(f"active in {proposal.get('region')}")
        if components["capacity_headroom"] >= 1.0:
            reasons.append("capacity covers the full ask")
        elif co_implementation:
            reasons.append("would need a co-implementation partner for scale")
        if not unscored:
            reasons.append(f"{int(partner.track_record * 100)}% on-time track record")
        shortlist.append(
            {
                "partner_id": partner.id,
                "name": partner.name,
                "fit": fit,
                "components": components,
                "co_implementation_suggested": co_implementation,
                "unscored": unscored,
                "badge": "new partner, unscored" if unscored else None,
                "avg_project_scale": partner.avg_project_scale,
                "track_record": partner.track_record,
                "cycles_completed": partner.cycles_completed,
                "sectors": partner.sectors,
                "regions": partner.regions,
                "contact": partner.contact,
                "rationale": "; ".join(reasons) or "no strong signal — advisory only",
            }
        )

    return {
        "proposal_id": proposal.get("id"),
        "proposal_title": proposal.get("title"),
        "proposal_sector": proposal.get("sector"),
        "proposal_region": proposal.get("region"),
        "beneficiaries": beneficiaries,
        "weights": FIT_WEIGHTS,
        "shortlist": shortlist,
        "note": (
            "Advisory only — the CSR Manager may fund the submitting NGO directly. "
            "Track record defaults to 0.5 for partners with no completed cycles."
        ),
    }
