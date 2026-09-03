"""Load synthetic proposals from CSV into the store (plan section 5.2)."""
from __future__ import annotations

import csv
import io
from pathlib import Path
from typing import List

from .config import SAMPLE_CSV_PATH
from .models import Proposal, store
from .scoring import score_proposal

REQUIRED_COLUMNS = {"ngo_name", "title", "sector", "region", "requested_amount", "beneficiaries"}


def _rows_to_proposals(reader: csv.DictReader) -> List[Proposal]:
    missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
    if missing:
        raise ValueError(f"CSV missing columns: {sorted(missing)}")
    proposals: List[Proposal] = []
    for i, row in enumerate(reader, start=1):
        try:
            amount = float(row["requested_amount"])
            beneficiaries = int(float(row["beneficiaries"]))
        except (TypeError, ValueError):
            raise ValueError(f"Row {i}: requested_amount/beneficiaries not numeric")
        if amount <= 0 or beneficiaries <= 0:
            continue  # skip junk rows rather than crash
        proposals.append(
            Proposal(
                id=0,
                ngo_name=row["ngo_name"].strip(),
                title=row["title"].strip(),
                sector=row["sector"].strip(),
                region=row["region"].strip(),
                requested_amount=amount,
                beneficiaries=beneficiaries,
            )
        )
    return proposals


def load_from_text(text: str, *, replace: bool = True) -> List[Proposal]:
    reader = csv.DictReader(io.StringIO(text))
    proposals = _rows_to_proposals(reader)
    if replace:
        store.clear()
    for p in proposals:
        score_proposal(p)
    return store.bulk_add(proposals)


def load_sample_dataset(*, replace: bool = True) -> List[Proposal]:
    path = Path(SAMPLE_CSV_PATH)
    if not path.exists():
        raise FileNotFoundError(
            f"{path} not found. Run: python data/generate_synthetic_data.py"
        )
    return load_from_text(path.read_text(encoding="utf-8"), replace=replace)
