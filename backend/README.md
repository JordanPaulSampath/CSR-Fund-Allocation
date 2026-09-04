# Saarthi — Backend

> Saarthi helps a CSR Manager score and allocate a fixed budget across NGO
> proposals fairly and transparently, and **optimize the allocation
> automatically**.

FastAPI service: a `Proposal` model, a hardcoded CSR-Manager login, a scoring
engine driven by a domain-expert weight config, and an `/allocate` endpoint
that solves a **0/1 knapsack ILP** — the differentiator. Single process,
in-memory store, no microservices, no database to stand up.

## Quick start

```bash
# Windows
run.bat

# macOS / Linux / Git Bash
./run.sh
```

Or manually:

```bash
python -m venv .venv
.venv\Scripts\activate            # Windows
# source .venv/bin/activate       # macOS/Linux
pip install -r requirements.txt
python data/generate_synthetic_data.py
uvicorn app.main:app --reload --port 8000
```

Open **http://localhost:8000/docs**. The server auto-loads the 30-row sample
dataset on startup, so it's demo-ready immediately.

## 60-second smoke test

```bash
curl -s -X POST localhost:8000/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"csr_manager","password":"saarthi2026"}'
# copy access_token -> $T

curl -s localhost:8000/proposals | head
curl -s -X POST "localhost:8000/allocate?total_budget=1500000" \
  -H "authorization: Bearer $T"
curl -s -X POST "localhost:8000/allocate/compare?total_budget=800000" \
  -H "authorization: Bearer $T"
```

## Tests

```bash
pytest            # optimizer tested in isolation + full API flow
```

## Project layout

```
app/
  main.py          FastAPI app + all routes
  models.py        Proposal dataclass + in-memory ProposalStore
  schemas.py       Pydantic request/response models (the frontend contract)
  scoring.py       score_proposal() — weighted, explainable, 0..10
  optimizer.py     allocate_budget() — PuLP ILP + greedy fallback + ranked baseline
  partners.py      Pillar 5 — implementing-partner capability profiles + fit-score match
  budget_advisor.py Pillar 6 — leftover-funds recommendation (next-best / partial / rollover)
  auth.py          signed expiring bearer token, one demo user
  config.py        loads/saves data/scoring_weights.yaml (live re-weighting)
  data_loader.py   CSV -> store
data/
  scoring_weights.yaml        Non-Tech #2 owns this
  ngo_partners.csv            implementing-partner directory + capability profiles
  generate_synthetic_data.py  run once -> sample_proposals.csv
tests/
frontend-example/  copy-paste api.js + ResultsView.jsx for Dev B
API_CONTRACT.md    every endpoint, every field
```

## How scoring works (say this on stage)

`final_score = 0.5·impact + 0.3·cost_efficiency + 0.2·feasibility`, each term
0–10. Weights come from `scoring_weights.yaml`, set by the team's CSR domain
expert — not hardcoded. `PUT /scoring/weights` re-weights and re-scores every
proposal live.

## How allocation works (the money shot)

`/allocate` maximises **total weighted score of funded proposals** subject to
`sum(requested_amount) <= total_budget` — an integer linear program solved
with CBC via PuLP. A ranked list can't do this: it overshoots the budget or
leaves money on the table. `/allocate/compare` shows both side by side and
hands you the sentence to say.

If the solver is ever unavailable, allocation silently falls back to a greedy
knapsack — the demo never dies. The `solver` field in the response says which
ran.

## Pillar 5 — right implementing partner (`/proposals/{id}/match`)

A high score doesn't mean the submitting NGO can deliver at scale. Each proposal
is reduced to a need-vector (sector, region, beneficiary scale) and matched
against the partner directory in `data/ngo_partners.csv`:

`fit = 0.35·sector_match + 0.25·region_presence + 0.20·capacity_headroom + 0.20·track_record`

The shortlist is advisory — a partner with no completed cycles gets a neutral
0.5 track record and a "new partner, unscored" badge; partners too small for the
ask are flagged `co_implementation_suggested`.

## Pillar 6 — remaining-budget advisor (`/allocate/remaining`)

An ILP rarely spends to the last rupee. After a run, `leftover = budget − spent`
feeds a three-branch decision: fund the next-best fit that fully fits, offer a
partial grant (≥70% coverage) on a near-miss, or flag a priority roll-over —
always one of the three, always recorded, never silently absorbed.

## Config (env vars, all optional)

| Var | Default | |
|---|---|---|
| `DATABASE_URL` | *(unset → SQLite `data/users.db`)* | Supabase/Postgres URI; `postgres://` and `postgresql://` are normalised automatically |
| `CORS_ORIGINS` | `*` | comma-separated allowed browser origins; `*.vercel.app` previews allowed automatically once set |
| `SAARTHI_SECRET` | demo string | **change in production** — signs login tokens |
| `SAARTHI_SEED_DEMO` | `1` | set `0` to stop seeding the 10 demo logins |
| `SAARTHI_AUTH_ENABLED` | `1` | set `0` to drop auth if the demo laptop misbehaves |
| `SAARTHI_USER` / `SAARTHI_PASSWORD` | `csr_manager` / `saarthi2026` | |
| `SAARTHI_WEIGHTS` | `data/scoring_weights.yaml` | |
| `SAARTHI_SAMPLE_CSV` | `data/sample_proposals.csv` | |

Deploying to Railway + Supabase: see **[../DEPLOY.md](../DEPLOY.md)**. `railway.json`,
`Procfile`, `runtime.txt`, `Dockerfile` and `.env.example` are all in this folder.

## Out of scope (roadmap — name it, don't build it)

Auditor role, MCA / government reviewer integration, penalty calculator,
NGO Darpan live data. All named as "next" in the pitch.

---
🤖 Backend scaffolding generated with [Claude Code](https://claude.com/claude-code)
