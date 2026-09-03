# Saarthi API contract

Base URL for the whole hackathon: `http://localhost:8000`
Interactive docs (try every endpoint in the browser): `http://localhost:8000/docs`

Auth: `POST /auth/login` returns a bearer token. Send it as
`Authorization: Bearer <token>` on every **write** endpoint (marked 🔒 below).
Read endpoints are open. To disable auth entirely, start the server with
`SAARTHI_AUTH_ENABLED=0`.

Demo login — username `csr_manager`, password `saarthi2026`.

All money is plain numbers in ₹ (rupees). No decimals expected in the UI.

---

## Auth

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/login` | `{username, password}` | `{access_token, token_type, expires_in, user}` |
| GET | `/auth/me` 🔒 | — | `{user, role}` |

## Proposals

| Method | Path | Notes |
|---|---|---|
| GET | `/proposals?sector=&region=&funded=` | list, all filters optional |
| GET | `/proposals/{id}` | one |
| POST | `/proposals` 🔒 | body `ProposalIn`; response is scored |
| POST | `/proposals/bulk` 🔒 | body `[ProposalIn, ...]` |
| DELETE | `/proposals/{id}` 🔒 | 204 |
| POST | `/proposals/load-samples?replace=true` 🔒 | loads `data/sample_proposals.csv` |
| POST | `/proposals/upload-csv?replace=true` 🔒 | multipart file upload |
| POST | `/proposals/reset` 🔒 | clears everything |

`ProposalIn`:
```json
{
  "ngo_name": "Asha Trust",
  "title": "Mobile Health Clinics #4",
  "sector": "health",
  "region": "Bihar",
  "requested_amount": 480000,
  "beneficiaries": 1200
}
```
Validation: `requested_amount > 0`, `beneficiaries > 0` → otherwise HTTP 422.

`ProposalOut` adds: `id, impact_potential, cost_per_beneficiary, feasibility,
final_score, score_breakdown{}, allocated_amount, is_funded`.

## Scoring / weights

| Method | Path | Notes |
|---|---|---|
| GET | `/scoring/weights` | `{impact, cost_efficiency, feasibility}` |
| PUT | `/scoring/weights` 🔒 | partial body ok; **re-scores all proposals** |
| POST | `/scoring/reset-weights` 🔒 | back to 0.5 / 0.3 / 0.2 |
| POST | `/scoring/recompute` 🔒 | re-read YAML from disk and re-score |

## Allocation — the differentiator

| Method | Path | Notes |
|---|---|---|
| POST | `/allocate?total_budget=<n>&strategy=<optimizer\|ranked\|greedy>` 🔒 | runs allocation, writes result back onto proposals |
| GET | `/allocate/last` | most recent allocation result |
| POST | `/allocate/compare?total_budget=<n>` 🔒 | optimizer vs ranked list, with a ready-to-say `headline` |

`AllocationResult`:
```json
{
  "strategy": "optimizer",
  "solver": "pulp-cbc (ILP)",
  "total_budget": 1500000,
  "spent": 1460000,
  "remaining": 40000,
  "total_score": 71.4,
  "total_beneficiaries": 18400,
  "funded": [ProposalOut, ...],
  "rejected": [ProposalOut, ...],
  "notes": ["Skipped '...' — requested_amount must be > 0."]
}
```

`compare` response: `{optimizer: AllocationResult, ranked: AllocationResult,
score_gain, beneficiary_gain, budget_better_used, headline}`.

## Implementing partners — Pillar 5 (right-partner matching)

| Method | Path | Notes |
|---|---|---|
| GET | `/partners?sector=&region=` | implementing-partner directory with capability profiles |
| POST | `/proposals/{id}/match?top_n=3` | ranked partner shortlist for one proposal |

Partner profiles are loaded from `data/ngo_partners.csv` (`sectors` / `regions`
are `;`-separated). `PartnerOut`: `{id, name, sectors[], regions[],
avg_project_scale, track_record, cycles_completed, contact, registration_no}`.

Fit score (0–1):
`0.35·sector_match + 0.25·region_presence + 0.20·capacity_headroom + 0.20·track_record`.
`capacity_headroom = min(1, avg_project_scale / beneficiaries)`. A partner with
`cycles_completed = 0` gets a neutral `track_record` of 0.5 and a
`"new partner, unscored"` badge. `co_implementation_suggested = true` when the
partner's average project scale is under half the proposal's beneficiary count.
Advisory only — never an automatic reassignment.

`PartnerMatchResult`:
```json
{
  "proposal_id": 12, "proposal_title": "...", "proposal_sector": "education",
  "proposal_region": "Maharashtra", "beneficiaries": 2000,
  "weights": {"sector_match": 0.35, "region_presence": 0.25, "capacity_headroom": 0.20, "track_record": 0.20},
  "shortlist": [
    {
      "partner_id": 1, "name": "Prayas Foundation", "fit": 0.98,
      "components": {"sector_match": 1.0, "region_presence": 1.0, "capacity_headroom": 1.0, "track_record": 0.92},
      "co_implementation_suggested": false, "unscored": false, "badge": null,
      "avg_project_scale": 3200, "track_record": 0.92, "cycles_completed": 7,
      "sectors": ["education", "women empowerment"], "regions": ["Maharashtra", "..."],
      "contact": "partnerships@prayasfoundation.org",
      "rationale": "works in education; active in Maharashtra; capacity covers the full ask; 92% on-time track record"
    }
  ],
  "note": "Advisory only ..."
}
```

## Remaining-budget advisor — Pillar 6

| Method | Path | Notes |
|---|---|---|
| GET | `/allocate/remaining` | leftover-funds recommendation for the most recent run; 404 before any allocation |

Runs the three-branch decision on `total_budget − spent`:
1. `next_best` — leftover fully covers the ask of the best impact-per-rupee unfunded proposal.
2. `partial_fund` — leftover covers ≥ 70% of a near-miss proposal (`coverage` = fraction covered).
3. `rollover` — nothing fits; flag for a priority boost next cycle.
Also `fully_utilised` when there is no leftover. `BudgetSuggestion`:
`{type, leftover, target_proposal_id, target_title, target_ngo, target_ask,
coverage, rationale, strategy, total_budget, spent, candidates_considered}`.

## Dashboard helpers

| Method | Path | Returns |
|---|---|---|
| GET | `/health` | status + weights |
| GET | `/stats` | totals for a summary bar |
| GET | `/meta/sectors` | `["education", ...]` |
| GET | `/meta/regions` | `["Bihar", ...]` |

---

## Edge cases the backend already handles (so the demo can't crash)

- `total_budget = 0` → 200 with empty `funded` and an explanatory `note`.
- Negative / zero `requested_amount` in a bulk load → row skipped, noted.
- `/allocate` with no proposals → clean HTTP 400, not a 500.
- PuLP / CBC solver missing or erroring → automatic greedy-knapsack fallback;
  `solver` field tells you which ran.
- Running `/allocate` twice → always recomputes from scratch, no stale state.
