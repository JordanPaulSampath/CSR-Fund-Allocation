"""State-level development-need index (0-100, higher = more under-served).

Derived from the NITI Aayog SDG India Index composite score, inverted. Used by
the Equity Snapshot / concentration logic (dossier Pillar 1). Same numbers the
dataset generator uses.
"""
from __future__ import annotations

DISTRICT_NEED_INDEX = {
    "Bihar": 84, "Jharkhand": 80, "Assam": 77, "Uttar Pradesh": 76, "Odisha": 74,
    "Madhya Pradesh": 74, "Chhattisgarh": 72, "Northeast": 70, "Rajasthan": 67,
    "West Bengal": 63, "Andhra Pradesh": 59, "Telangana": 55, "Uttarakhand": 52,
    "Maharashtra": 51, "Gujarat": 49, "Haryana": 48, "Punjab": 47, "Karnataka": 47,
    "Tamil Nadu": 41, "Delhi NCR": 37, "Himachal Pradesh": 36, "Kerala": 28, "Goa": 27,
}

DEFAULT_NEED = 55


def need_index(region: str) -> int:
    return DISTRICT_NEED_INDEX.get(region, DEFAULT_NEED)
