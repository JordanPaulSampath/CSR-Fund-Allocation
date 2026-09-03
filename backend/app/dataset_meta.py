"""Provenance for the bundled proposal dataset.

Surfaced by ``GET /api/dataset`` and the "Dataset & Sources" screen so the
calibration is auditable in-app, not just in a markdown file. Full detail +
figures live in ``backend/data/DATASET_SOURCES.md``.
"""
from __future__ import annotations

GITHUB_CSV_URL = (
    "https://github.com/JordanPaulSampath/CSR-Fund-Allocation/blob/main-2/"
    "backend/data/sample_proposals.csv"
)
GITHUB_RAW_CSV_URL = (
    "https://raw.githubusercontent.com/JordanPaulSampath/CSR-Fund-Allocation/"
    "main-2/backend/data/sample_proposals.csv"
)

DATASET_INFO = {
    "name": "CSR proposal dataset (calibrated synthetic)",
    "rows": 220,
    "schema": [
        "ngo_name", "title", "sector", "region",
        "requested_amount", "beneficiaries", "district_need_index",
    ],
    "download_csv": "/dataset/sample_proposals.csv",
    "github": GITHUB_CSV_URL,
    "github_raw": GITHUB_RAW_CSV_URL,
    "methodology": (
        "No row is a real proposal — proposal-level CSR data is not published. "
        "The sector mix, state mix, ticket sizes, cost-per-beneficiary and "
        "district-need score are calibrated to official Government of India CSR "
        "aggregates (FY 2022-23). Frozen seed -> reproducible file."
    ),
    "calibration_facts": [
        "Total CSR spend FY23 ~ Rs 29,987 crore across ~51,966 projects.",
        "Education ~34% of spend (largest single sector); Healthcare ~22%.",
        "Environment ~10%; Rural/community development ~7%; WASH ~6%; livelihood ~4%.",
        "Maharashtra leads state-wise (~Rs 5,494 cr FY23); top ~6 states take ~60%.",
        "~84% of CSR spend comes from companies outside the public sector.",
    ],
    "sources": [
        {
            "title": "National CSR Portal",
            "publisher": "Ministry of Corporate Affairs (MCA), Govt. of India",
            "url": "https://www.csr.gov.in/",
            "used_for": "CSR reporting structure; headline FY totals",
        },
        {
            "title": "Development Sector-wise CSR Expenditure, 2018-19 to 2022-23",
            "publisher": "Open Government Data (OGD) Platform India / MCA",
            "url": "https://www.data.gov.in/resource/development-sector-wise-details-corporate-social-responsibility-csr-expenditure-2018-19-0",
            "used_for": "Sector weights",
        },
        {
            "title": "State/UT-wise CSR Expenditure, 2018-19 to 2022-23",
            "publisher": "Open Government Data (OGD) Platform India / MCA",
            "url": "https://www.data.gov.in/resource/stateut-wise-details-expenditure-corporate-social-responsibility-csr-2018-19-2022-23",
            "used_for": "State weights for region",
        },
        {
            "title": "MCA Corporate Data Management — Development-wise & State-wise CSR",
            "publisher": "MCA Corporate Data Management portal",
            "url": "https://www.mcacdm.nic.in/development_wise.php",
            "used_for": "Cross-check of sector and state shares",
        },
        {
            "title": "SDG India Index & Dashboard",
            "publisher": "NITI Aayog",
            "url": "https://www.niti.gov.in/reports-sdg",
            "used_for": "District / state development-gap score (district_need_index)",
        },
        {
            "title": "NGO Darpan",
            "publisher": "NITI Aayog",
            "url": "https://ngodarpan.gov.in/",
            "used_for": "Realistic NGO naming and sector/state patterns",
        },
        {
            "title": "Where the CSR Money Went — CSR Statistics",
            "publisher": "Dataful (Factly Media)",
            "url": "https://insights.dataful.in/articles/where-the-csr-money-went-tracking-csr-spending-in-india",
            "used_for": "Sanity-bounding cost-per-beneficiary ranges",
        },
        {
            "title": "Education made up 33% of firms' CSR spend in FY23, shows govt data",
            "publisher": "Business Standard",
            "url": "https://www.business-standard.com/education/news/education-sector-makes-up-one-third-of-total-csr-spend-in-fy23-govt-data-124080801216_1.html",
            "used_for": "Sector share figures",
        },
        {
            "title": "10 states received 60% of the total CSR spend by India Inc",
            "publisher": "Business Today",
            "url": "https://www.businesstoday.in/latest/economy/story/maharashtra-rajasthan-tamil-nadu-these-10-states-received-60-of-the-total-csr-spend-by-india-inc-check-details-here-473862-2025-04-28",
            "used_for": "State concentration figures",
        },
    ],
}
