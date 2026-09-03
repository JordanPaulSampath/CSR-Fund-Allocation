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
