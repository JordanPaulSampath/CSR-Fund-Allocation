# Saarthi — CSR Fund Allocation

A CSR Manager scores NGO proposals, allocates a fixed budget with an
equity-constrained optimizer, finds the right **implementing partner** for each
funded project, and gets a **recommendation for whatever budget is left over**.

React frontend + FastAPI backend. In production they run as **one server on one
port**; in dev they run as two with the API proxied.

---

## Run it (one command)

```bash
python run.py
```

This builds the UI once, then serves the **UI and the API together on
http://localhost:8000** and opens your browser. The 250-row sample dataset
loads automatically.

**Login:** click **Continue as demo**, or use one of the seeded accounts:

| User | Password | Role |
|---|---|---|
| `csr_manager` | `saarthi2026` | CSR Manager |
| `demo` | `demo12345` | CSR Manager |
| `cfo` | `finance2026` | Finance Head |
| `program_officer` | `program2026` | Program Officer |
| `auditor` | `auditor2026` | Compliance Auditor |
| `board` | `board2026` | Board Member |

(Credentials are intentionally not shown on the login screen.)

| Command | What it does |
|---|---|
| `python run.py` | build UI + serve everything on `:8000` |
| `python run.py --dev` | hot-reload: API on `:8000`, Vite UI on `:5173` |
| `python run.py --build` | force a fresh UI build first |
| `run.bat` | Windows double-click wrapper for the above |

First run installs dependencies automatically. If your `pip` is blocked by
antivirus (Windows Defender sometimes quarantines pip's script stubs), install
once by hand then re-run:

```bash
cd backend && python -m pip install -r requirements.txt
cd ../frontend && npm install
```

---

## Screens

**Allocation** — Proposals · Settlement · Partner Match · Equity Snapshot
**Compliance** — Compliance · CSR-2 Filing · Audit Trail
**Operations** — Project Tracker · Impact Overview · Partner Directory
**Data** — Dataset & Sources

## What's inside

```
backend/          FastAPI — scoring, equity ILP optimizer, partner match, budget advisor
  app/partners.py         Pillar 5 — implementing-partner fit scoring
  app/budget_advisor.py   Pillar 6 — leftover-funds recommendation
  app/ledger.py           Pillar 4 — hash-chained tamper-evident audit trail
  app/geo.py              NITI Aayog SDG-derived state need index
  app/dataset_meta.py     dataset provenance surfaced at /api/dataset
  data/sample_proposals.csv   220 proposals calibrated to official GoI CSR aggregates
  data/DATASET_SOURCES.md     every calibration source, with links
  data/ngo_partners.csv       18 implementing partners with capability profiles
frontend/         React + Vite + Tailwind ("Operations Console" theme)
run.py            one-command launcher (build + serve, or dev)
```

## Dataset

`backend/data/sample_proposals.csv` — 220 synthetic NGO proposals whose sector
mix, state mix, ticket sizes and district-need scores are **calibrated to
official Government of India CSR aggregates (FY 2022-23)**. No row is a real
proposal. Full source list: [`backend/data/DATASET_SOURCES.md`](backend/data/DATASET_SOURCES.md)
· raw file:
[`sample_proposals.csv`](https://raw.githubusercontent.com/JordanPaulSampath/CSR-Fund-Allocation/main-2/backend/data/sample_proposals.csv)
· regenerate: `python backend/data/generate_synthetic_data.py`

Full API reference: [`backend/API_CONTRACT.md`](backend/API_CONTRACT.md) ·
interactive docs at `http://localhost:8000/docs`.

## Manual run (two terminals)

```bash
# terminal 1
cd backend && python -m uvicorn app.main:app --reload --port 8000
# terminal 2
cd frontend && npm run dev          # http://localhost:5173 (proxies /api etc. to :8000)
```

## Tests

```bash
cd backend && python -m pytest        # 24 tests: optimizer, API flow, partners, budget advisor
cd frontend && npm run build          # type/import/JSX check
```

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
