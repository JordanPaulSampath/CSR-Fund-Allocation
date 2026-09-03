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

**Login:** `csr_manager` / `saarthi2026`  · or · `demo` / `demo12345`
(or click **Continue as demo** on the login screen).

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

## What's inside

```
backend/          FastAPI — scoring, equity ILP optimizer, partner match, budget advisor
  app/partners.py         Pillar 5 — implementing-partner fit scoring
  app/budget_advisor.py   Pillar 6 — leftover-funds recommendation
  data/sample_proposals.csv   250 calibrated synthetic proposals (auto-loaded)
  data/ngo_partners.csv       18 implementing partners with capability profiles
frontend/         React + Vite + Tailwind
run.py            one-command launcher (build + serve, or dev)
```

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
