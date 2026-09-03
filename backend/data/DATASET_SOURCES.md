# Dataset provenance — `sample_proposals.csv`

**What this file is:** 220 synthetic NGO project proposals whose *distributions*
(sector mix, state mix, ticket sizes, per‑beneficiary cost, district need) are
**calibrated to real, official, aggregate CSR statistics** published by the
Government of India. No row is a real proposal or a real organisation — real
proposal‑level CSR data is not published, and scraping individual NGOs would be
wrong. Calibrating against public aggregates gives data that *behaves* like real
CSR spending for demo and evaluation purposes.

Regenerate anytime: `python data/generate_synthetic_data.py` (frozen seed → identical file).

---

## Trusted official sources used for calibration

| # | Source | Publisher | What we took from it |
|---|--------|-----------|----------------------|
| 1 | [National CSR Portal — csr.gov.in](https://www.csr.gov.in/) | Ministry of Corporate Affairs (MCA), Govt. of India | Structure of CSR reporting; headline FY totals |
| 2 | [Development Sector‑wise CSR Expenditure, 2018‑19 to 2022‑23](https://www.data.gov.in/resource/development-sector-wise-details-corporate-social-responsibility-csr-expenditure-2018-19-0) | Open Government Data (OGD) Platform India / MCA | **Sector weights** (education, health, environment, WASH, livelihood, …) |
| 3 | [State/UT‑wise CSR Expenditure, 2018‑19 to 2022‑23](https://www.data.gov.in/resource/stateut-wise-details-expenditure-corporate-social-responsibility-csr-2018-19-2022-23) | Open Government Data (OGD) Platform India / MCA | **State weights** for `region` |
| 4 | [MCA Corporate Data Management — Development‑wise & State‑wise CSR](https://www.mcacdm.nic.in/development_wise.php) | MCA Corporate Data Management portal | Cross‑check of sector and state shares |
| 5 | [SDG India Index & Dashboard](https://www.niti.gov.in/reports-sdg) | NITI Aayog | **District / state development‑gap score** → `district_need_index` |
| 6 | [NGO Darpan](https://ngodarpan.gov.in/) | NITI Aayog | Realistic NGO naming and sector/state patterns (aggregate view only) |
| 7 | [Dataful — CSR Statistics collection](https://insights.dataful.in/articles/where-the-csr-money-went-tracking-csr-spending-in-india) | Dataful (Factly Media) — cleaned mirror of OGD data | Sanity‑bounding cost‑per‑beneficiary ranges |

### Key figures baked into the generator (FY 2022‑23, unless noted)

- **Total CSR spend:** ≈ ₹29,987 crore (up from ₹26,580 cr in FY22); ~51,966 projects.
- **Sector mix:** Education ≈ ₹10,085 cr (**~34%**, the single largest), Healthcare **~22%**,
  Environment ≈ ₹2,921 cr (**~10%**), Rural/Community development ≈ ₹2,005 cr (**~7%**),
  Vocational skills / livelihood ≈ ₹1,164 cr (**~4%**), WASH **~6%**, Women empowerment ≈ ₹396 cr,
  Technology incubators ≈ ₹1 cr (**lowest**).
- **State mix:** Maharashtra is the clear leader (≈ ₹5,494 cr); Karnataka, Gujarat, Delhi,
  Tamil Nadu, Andhra Pradesh follow — the **top ~6 states take ~60%** of all CSR spend.
- Companies **outside** the public sector contribute **~84%** of CSR spend.

Sources for the figures above:
- [Business Standard — "Education made up 33% of firms' CSR spend in FY23, shows govt data"](https://www.business-standard.com/education/news/education-sector-makes-up-one-third-of-total-csr-spend-in-fy23-govt-data-124080801216_1.html)
- [Protean / NSE — "India's CSR Landscape: INR 15,524 Crore Spent…"](https://www.proteantech.in/articles/nse-listed-companies-csr-spend-india-05112024/)
- [Business Today — "10 states received 60% of the total CSR spend"](https://www.businesstoday.in/latest/economy/story/maharashtra-rajasthan-tamil-nadu-these-10-states-received-60-of-the-total-csr-spend-by-india-inc-check-details-here-473862-2025-04-28)
- [Drishti IAS — CSR Expenditure 2023](https://www.drishtiias.com/daily-updates/daily-news-analysis/csir-expenditure-2023)

## CSV schema

`ngo_name, title, sector, region, requested_amount, beneficiaries, district_need_index`

`requested_amount` is in ₹. `district_need_index` is 0–100 (higher = more
under‑served), derived from the NITI Aayog SDG India Index (composite score,
inverted). The scoring/optimizer only requires the first six columns; the need
index is used by the equity‑constrained allocator.
