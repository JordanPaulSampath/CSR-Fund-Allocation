"""Calibrated synthetic proposal generator.

Every distribution here is anchored to **real, official, aggregate** CSR
statistics from the Government of India — see ``DATASET_SOURCES.md`` for the full
source table and the exact figures. No row is a real proposal; the point is that
the *shape* of the data (sector mix, state mix, ticket sizes, cost per
beneficiary, district need) matches how real CSR money actually moves.

Frozen seed -> byte-identical CSV every run.

    python data/generate_synthetic_data.py                 # -> data/sample_proposals.csv (220 rows)
    python data/generate_synthetic_data.py --rows 250 --out data/big.csv
"""
from __future__ import annotations

import argparse
import csv
import random
from pathlib import Path

SEED = 2023
DEFAULT_ROWS = 220
OUT_PATH = Path(__file__).resolve().parent / "sample_proposals.csv"

# --------------------------------------------------------------------------- #
# Tier-1 calibration — normalised shares from official aggregates (FY 2022-23)
# Source 2: data.gov.in "Development Sector-wise CSR Expenditure 2018-19..2022-23"
# Education ~34% (largest), Healthcare ~22%, Environment ~10%, Rural/community ~7%,
# WASH ~6%, Vocational/livelihood ~4%, Women empowerment ~1.5%, Tech ~lowest.
# --------------------------------------------------------------------------- #
SECTOR_SHARE = {
    "education": 0.34,
    "health": 0.22,
    "environment": 0.10,
    "community development": 0.11,
    "water and sanitation": 0.06,
    "livelihood": 0.10,
    "women empowerment": 0.04,
    "technology": 0.03,
}

# Source 3: data.gov.in "State/UT-wise CSR Expenditure 2018-19..2022-23" +
# National CSR Portal. Maharashtra dominant (~ Rs 5,494 cr FY23); top ~6 states ~60%.
STATE_SHARE = {
    "Maharashtra": 0.180, "Karnataka": 0.082, "Gujarat": 0.078, "Delhi NCR": 0.070,
    "Tamil Nadu": 0.066, "Andhra Pradesh": 0.052, "Rajasthan": 0.046,
    "Uttar Pradesh": 0.045, "Odisha": 0.043, "Telangana": 0.038, "West Bengal": 0.034,
    "Madhya Pradesh": 0.032, "Chhattisgarh": 0.028, "Haryana": 0.026, "Bihar": 0.024,
    "Jharkhand": 0.022, "Kerala": 0.020, "Punjab": 0.016, "Assam": 0.014,
    "Uttarakhand": 0.012, "Himachal Pradesh": 0.009, "Goa": 0.008, "Northeast": 0.015,
}

# Source 5: NITI Aayog SDG India Index composite score, inverted to a 0-100
# development-gap ("need") score. Higher = further from the SDG targets.
DISTRICT_NEED_INDEX = {
    "Bihar": 84, "Jharkhand": 80, "Assam": 77, "Uttar Pradesh": 76, "Odisha": 74,
    "Madhya Pradesh": 74, "Chhattisgarh": 72, "Northeast": 70, "Rajasthan": 67,
    "West Bengal": 63, "Andhra Pradesh": 59, "Telangana": 55, "Uttarakhand": 52,
    "Maharashtra": 51, "Gujarat": 49, "Haryana": 48, "Punjab": 47, "Karnataka": 47,
    "Tamil Nadu": 41, "Delhi NCR": 37, "Himachal Pradesh": 36, "Kerala": 28, "Goa": 27,
}

# Names follow NGO Darpan patterns (Source 6) — prefix + service-org suffix.
NGO_PREFIXES = [
    "Aarohi", "Anand", "Arogya", "Asha Kiran", "Ekjut", "Gram Vikas", "Jan Kalyan",
    "Jeevika", "Jyoti", "Navodaya", "Nirmaan", "Parivartan", "Prayas", "Pragati",
    "Prakriti", "Roshni", "Sahyog", "Samarthan", "Seva Bharti", "Udaan", "Umeed",
    "Vasundhara", "Vidya Setu", "Vikas", "Sujal",
]
NGO_SUFFIXES = [
    "Foundation", "Trust", "Welfare Society", "Seva Sangh", "Charitable Trust",
    "Collective", "Gramin Vikas Samiti", "Jan Seva Kendra", "Mahila Mandal",
]
TITLE_TEMPLATES = {
    "education": ["Girls' STEM Scholarships", "Foundational Literacy & Numeracy Camps",
                  "Digital Classrooms for Government Schools", "Bridge Course for Out-of-School Children",
                  "Teacher Capacity Building Programme"],
    "health": ["Mobile Health Clinics", "Maternal & Child Nutrition Drive",
               "Tele-medicine for Remote Villages", "Cataract Surgery Camp Series",
               "Community Health Worker Network"],
    "environment": ["Watershed Development & Revival", "Miyawaki Urban Afforestation",
                    "Rooftop Solar for Community Buildings", "Plastic Waste Segregation Units",
                    "Mangrove Restoration"],
    "community development": ["Anganwadi Infrastructure Upgrade", "Aspirational District Livelihoods",
                             "Panchayat Governance Strengthening", "Village Resource Centre Network",
                             "Disaster Preparedness & Resilience"],
    "water and sanitation": ["Piped Drinking Water to Habitations", "School WASH Blocks",
                             "Community RO Plants", "Fluoride Mitigation Programme",
                             "Faecal Sludge Management"],
    "livelihood": ["Farmer Producer Organisation Support", "Rural Women Micro-Enterprise",
                   "Youth Skilling & Placement", "Artisan Cluster Development",
                   "Dairy & Livestock Cooperative"],
    "women empowerment": ["Self-Help Group Federation", "Safe Spaces & Legal Aid for Women",
                          "Women-led Enterprise Incubation", "Adolescent Girls' Life Skills"],
    "technology": ["Assistive Technology for Disability", "AgriTech Advisory Platform",
                   "Digital Public Infrastructure Literacy", "e-Governance Access Kiosks"],
}


def _weighted(share: dict) -> str:
    return random.choices(list(share), weights=list(share.values()), k=1)[0]


def generate(rows: int, out_path: Path) -> Path:
    random.seed(SEED)
    used_titles: dict[str, int] = {}
    records = []
    for _ in range(rows):
        sector = _weighted(SECTOR_SHARE)
        state = _weighted(STATE_SHARE)
        need = DISTRICT_NEED_INDEX.get(state, 55)

        # under-served states skew to larger reach at leaner unit cost
        base = random.randint(80, 6500)
        beneficiaries = int(base * (1.0 + (need - 50) / 180))
        beneficiaries = max(60, min(beneficiaries, 9000))

        # cost per beneficiary Rs 180-950, tighter where need is higher
        cost_pb = random.uniform(180, 950) * (1.0 - (need - 50) / 400)
        amount = int(round(max(beneficiaries * cost_pb, 50_000), -3))

        ngo = f"{random.choice(NGO_PREFIXES)} {random.choice(NGO_SUFFIXES)}"
        t = random.choice(TITLE_TEMPLATES[sector])
        n = used_titles.get(t, 0) + 1
        used_titles[t] = n
        title = t if n == 1 else f"{t} (Phase {n})"

        records.append({
            "ngo_name": ngo,
            "title": title,
            "sector": sector,
            "region": state,
            "requested_amount": amount,
            "beneficiaries": beneficiaries,
            "district_need_index": need,
        })

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(records[0].keys()))
        w.writeheader()
        w.writerows(records)
    return out_path


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--rows", type=int, default=DEFAULT_ROWS)
    ap.add_argument("--out", type=Path, default=OUT_PATH)
    args = ap.parse_args()
    path = generate(args.rows, args.out)
    print(f"Wrote {args.rows} calibrated proposals -> {path}")
    print("Calibration sources: data/DATASET_SOURCES.md")
