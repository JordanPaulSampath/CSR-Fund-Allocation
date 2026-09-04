# Deployment — Vercel + Railway + Supabase

```
 Browser ──▶ Vercel (frontend, static)  ──fetch──▶ Railway (FastAPI)  ──▶ Supabase (Postgres)
```

The frontend and backend are **separate deployments**. The frontend needs to
know the backend URL (`VITE_API_URL`); the backend needs to allow the frontend
origin (`CORS_ORIGINS`) and a database (`DATABASE_URL`).

---

## 1. Database — Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → Database → Connection string → URI.** Copy it.
   Prefer the **connection pooler** URI (host `...pooler.supabase.com`, port `6543`)
   for a platform like Railway.
   ```
   postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
   ```
3. That's it — the backend **creates its own `users` table on first boot**
   (`init_db()` / `seed_demo_user()`), so no SQL migration to run. The 10 demo
   logins are seeded automatically; set `SAARTHI_SEED_DEMO=0` later to stop that.

Proposals, the audit ledger and scoring weights are **not** stored in Postgres —
they're in-memory/CSV demo state that resets on redeploy, by design.

---

## 2. Backend — Railway

1. [railway.com](https://railway.com) → **New Project → Deploy from GitHub repo** →
   pick this repo.
2. In the service **Settings**:
   - **Root Directory:** `backend`
   - Build/start are picked up from `backend/railway.json` (NIXPACKS, start =
     `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, healthcheck `/health`).
3. **Variables** tab — add:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | the Supabase URI from step 1 |
   | `CORS_ORIGINS` | `https://<your-app>.vercel.app` (you'll get this in step 3; can start as `*` and tighten later) |
   | `SAARTHI_SECRET` | a long random string (`openssl rand -hex 32`) |
4. Deploy. Railway gives you a URL like `https://saarthi-backend-production.up.railway.app`.
   Check `https://<that>/health` returns `{"status":"ok",...}` and `/docs` loads.

Files that make this work: `backend/railway.json`, `backend/Procfile`,
`backend/runtime.txt`, `backend/.python-version`, `backend/requirements.txt`,
`backend/Dockerfile` (only if you switch Railway's builder to Docker).

---

## 3. Frontend — Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → import this repo.
2. **Root Directory:** `frontend` (Vercel then reads `frontend/vercel.json`;
   framework auto-detects as Vite, output `dist`).
3. **Environment Variables** → add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | the Railway URL from step 2, **no trailing slash** |
4. Deploy. You get `https://<your-app>.vercel.app`.
5. Go back to Railway → set `CORS_ORIGINS` to that exact URL → redeploy the backend.
   (`*.vercel.app` preview deployments are allowed automatically once
   `CORS_ORIGINS` is not `*`.)

Files: `frontend/vercel.json`, `frontend/.env.example`.

---

## Local development still works unchanged

```bash
python run.py          # UI + API on http://localhost:8000 (SQLite, no env needed)
```

`VITE_API_URL` unset → the Vite dev server proxies API paths to `localhost:8000`.
`DATABASE_URL` unset → the backend uses a local `backend/data/users.db` SQLite file.

## Environment variables, in full

**Backend** (`backend/.env.example`): `DATABASE_URL`, `CORS_ORIGINS`,
`SAARTHI_SECRET`, `SAARTHI_TOKEN_TTL`, `SAARTHI_SEED_DEMO`.

**Frontend** (`frontend/.env.example`): `VITE_API_URL`.
