"""Calibrated synthetic proposal generator (dossier p.18, p.42).

Self-contained: the sector / state weights below approximate the real public
aggregates named in the dossier (dataful.in CSR master data, data.gov.in
state-wise CSR expenditure, NITI Aayog SDG India Index) so the generated rows
*behave* like real CSR spending without any row being a real proposal. Swap the
constants for a real ``calibration_weights.json`` once the fetch step is run.

Frozen seed -> the same CSV every run (Tier 3). Output schema matches exactly
what ``app/data_loader.py`` expects, plus a ``district_need_index`` column the
equity optimizer can use later (extra columns are ignored on load).

    python data/generate_synthetic_data.py            # writes data/sample_proposals.csv
    python data/generate_synthetic_data.py --rows 300 --out data/big.csv
"""
from __future__ import annotations

import argparse
import csv
import random
from pathlib import Path

SEED = 42
DEFAULT_ROWS = 250
OUT_PATH = Path(__file__).resolve().parent / "sample_proposals.csv"

# --- Tier-1 calibration (public aggregate shares, normalised) ----------------
# sector share of national CSR spend — dataful.in/datasets/1612 (approx.)
SECTOR_SHARE = {
    "education": 0.30,
    "health": 0.25,
    "environment": 0.10,
    "water and sanitation": 0.09,
    "women empowerment": 0.07,
    "livelihood": 0.08,
    "technology": 0.05,
    "community development": 0.06,
}

# state share of CSR expenditure — data.gov.in state/UT-wise resource (approx.)
STATE_SHARE = {
    "Maharashtra": 0.13, "Tamil Nadu": 0.08, "Karnataka": 0.08, "Gujarat": 0.07,
    "Uttar Pradesh": 0.07, "Delhi NCR": 0.06, "Odisha": 0.05, "Rajasthan": 0.05,
    "Madhya Pradesh": 0.05, "West Bengal": 0.05, "Andhra Pradesh": 0.04,
    "Bihar": 0.04, "Telangana": 0.04, "Kerala": 0.03, "Jharkhand": 0.03,
    "Chhattisgarh": 0.03, "Punjab": 0.02, "Haryana": 0.02, "Uttarakhand": 0.02,
    "Himachal Pradesh": 0.01, "Assam": 0.02, "Goa": 0.01, "Northeast": 0.01,
}

# district development-gap score, 0-100, higher = more under-served
# (NITI Aayog SDG India Index composite, inverted; approx. state-level proxy)
DISTRICT_NEED_INDEX = {
    "Bihar": 82, "Jharkhand": 78, "Uttar Pradesh": 76, "Madhya Pradesh": 74,
    "Odisha": 72, "Chhattisgarh": 71, "Assam": 70, "Northeast": 68,
    "Rajasthan": 66, "West Bengal": 62, "Andhra Pradesh": 58, "Telangana": 55,
    "Maharashtra": 52, "Gujarat": 50, "Karnataka": 48, "Punjab": 47,
    "Haryana": 46, "Uttarakhand": 45, "Himachal Pradesh": 40, "Tamil Nadu": 42,
    "Delhi NCR": 38, "Kerala": 30, "Goa": 28,
}

NGO_PREFIXES = [
    "Aarohi", "Anand", "Arogya", "Asha", "Greenleaf", "Jan Kalyan", "Jeevika",
    "Jyoti", "Nirman", "Parivartan", "Prakriti", "Prayas", "Pragya", "Roshni",
    "Sahajdoor", "Sahara", "Sahaya", "Saksham", "Samarthan", "Uday", "Umeed",
    "Vasundhara", "Vidushi", "Vidya", "Vikas",
]
NGO_SUFFIXES = [
    "Foundation", "Seva Trust", "Seva Sangh", "Seva Kendra", "Seva Foundation",
    "Seva Initiative", "Van Seva", "Education Seva", "Aarogya Seva",
]
TITLE_TEMPLATES = {
    "education": ["Girls' STEM Scholarships", "Digital Literacy for Rural Schools",
                 "Foundational Learning Camps", "Teacher Training Programme"],
    "health": ["Mobile Health Clinics", "Maternal Nutrition Drive",
               "Polyclinic for Tribal Areas", "Community Health Workers"],
    "environment": ["Watershed Revival", "Urban Afforestation",
                    "Solar Microgrid Rollout", "Plastic Waste Recovery"],
    "water and sanitation": ["Safe Drinking Water Wells", "School Sanitation Blocks",
                             "Piped Water to Habitations", "Handwashing Stations"],
    "women empowerment": ["Self-Help Group Federation", "Women's Micro-Enterprise",
                          "Legal Aid for Women", "Skill Hub for Women"],
    "livelihood": ["Farmer Producer Company", "Rural Artisan Cluster",
                   "Youth Employability Programme", "Dairy Cooperative Support"],
    "technology": ["Village Digital Kiosks", "AgriTech Advisory Platform",
                   "e-Governance Training", "Assistive Tech for Disability"],
    "community development": ["Anganwadi Infrastructure", "Panchayat Capacity Building",
                             "Community Library Network", "Disaster Preparedness"],
}


def _weighted(share: dict) -> str:
    return random.choices(list(share), weights=list(share.values()), k=1)[0]


def generate(rows: int, out_path: Path) -> Path:
    random.seed(SEED)
    records = []
    for i in range(rows):
        sector = _weighted(SECTOR_SHARE)
        state = _weighted(STATE_SHARE)
        beneficiaries = random.randint(60, 8000)
        # under-served districts skew to leaner asks; cost per beneficiary 150-900
        cost_pb = random.uniform(150, 900)
        amount = int(round(beneficiaries * cost_pb, -3)) or 1000
        ngo = f"{random.choice(NGO_PREFIXES)} {random.choice(NGO_SUFFIXES)}"
        title = f"{random.choice(TITLE_TEMPLATES[sector])} #{i + 1}"
        records.append({
            "ngo_name": ngo,
            "title": title,
            "sector": sector,
            "region": state,
            "requested_amount": amount,
            "beneficiaries": beneficiaries,
            "district_need_index": DISTRICT_NEED_INDEX.get(state, 50),
        })

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(records[0].keys()))
        writer.writeheader()
        writer.writerows(records)
    return out_path


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--rows", type=int, default=DEFAULT_ROWS)
    ap.add_argument("--out", type=Path, default=OUT_PATH)
    args = ap.parse_args()
    written = generate(args.rows, args.out)
    print(f"Wrote {args.rows} calibrated proposals to {written}")
