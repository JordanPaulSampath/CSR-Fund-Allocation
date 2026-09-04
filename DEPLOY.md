# Deploying Saarthi — the simple version

You are going to put three things online:

| Piece | Goes on | Free? | What it does |
|---|---|---|---|
| **Database** | Supabase | yes | stores the user logins |
| **Backend** (the API) | Railway | yes trial / low cost | does the scoring + optimisation |
| **Frontend** (the website) | Vercel | yes | the pages people open in a browser |

Do them **in this order**: Supabase → Railway → Vercel. Each one gives you a
value you paste into the next.

**Before you start:** push this project to a GitHub repo, and make free accounts
on [supabase.com](https://supabase.com), [railway.com](https://railway.com) and
[vercel.com](https://vercel.com) — sign in to all three with the same GitHub
account, it's easiest.

Total time: about 20 minutes.

---

## PART 1 — Database on Supabase (~5 min)

1. Go to **supabase.com → New project**.
2. Give it a name (e.g. `saarthi`), set a **database password** (write it down),
   pick the region closest to you, click **Create new project**. Wait ~2 min.
3. Left sidebar → **Project Settings** (gear icon) → **Database**.
4. Scroll to **Connection string**, click the **URI** tab, and choose the
   **"Connection pooling"** option (the host ends in `pooler.supabase.com`).
5. Copy that string. It looks like:
   ```
   postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the password from step 2.
   **Keep this line safe — you need it in Part 2.**

> You do **not** create any tables. The backend builds its own table the first
> time it starts.

---

## PART 2 — Backend on Railway (~7 min)

1. Go to **railway.com → New Project → Deploy from GitHub repo** → pick this repo.
2. Railway starts building. It will probably fail the first time — that's fine,
   we haven't given it settings yet. Open the service (the box it created).
3. **Settings** tab:
   - Find **Root Directory** → set it to `backend` → save.
   - (Everything else — build command, start command, health check — is already
     in `backend/railway.json`, so leave it.)
4. **Variables** tab → **New Variable** → add these three (name on the left,
   value on the right):

   | Variable name | Value |
   |---|---|
   | `DATABASE_URL` | the full string you saved in Part 1 |
   | `SAARTHI_SECRET` | any long random text — mash the keyboard, 30+ characters |
   | `CORS_ORIGINS` | `*` &nbsp;(we fix this in Part 3) |

5. Go to **Settings → Networking → Generate Domain**. Railway gives you a URL
   like `https://saarthi-backend-production.up.railway.app`. **Copy it.**
6. Railway redeploys automatically. When it's green, open
   `https://<your-railway-url>/health` in a browser — you should see
   `{"status":"ok", ...}`. Also try `/docs` for the API explorer.

If it won't build: **Deployments** tab → click the failed one → read the log.
Usually it's a typo in `DATABASE_URL`.

---

## PART 3 — Frontend on Vercel (~5 min)

1. Go to **vercel.com → Add New → Project** → import this repo.
2. On the configure screen:
   - **Root Directory** → click **Edit** → choose `frontend`.
   - Framework Preset should auto-fill as **Vite**. Leave build settings alone.
3. Expand **Environment Variables** and add one:

   | Name | Value |
   |---|---|
   | `VITE_API_URL` | your Railway URL from Part 2 — **no slash at the end** |

4. Click **Deploy**. Wait ~1 min. You get a URL like
   `https://saarthi.vercel.app`. **Copy it.**

---

## PART 4 — Connect the two (~1 min)

1. Back on **Railway → your service → Variables**.
2. Change `CORS_ORIGINS` from `*` to your exact Vercel URL, e.g.
   `https://saarthi.vercel.app` → save. Railway redeploys.

That's the security step: it tells the backend "only accept requests coming from
my website". Preview links Vercel makes for branches (`...-git-...vercel.app`)
keep working automatically.

---

## You're done when…

- Opening your **Vercel URL** shows the login page.
- **"Continue as demo"** logs you in and the dashboard loads with 220 proposals.
- Uploading a CSV runs the optimiser and shows the Settlement screen.

**Log in with** any of: `csr_manager` / `saarthi2026`, `demo` / `demo12345`,
`cfo` / `finance2026` … (full list in `backend/API_CONTRACT.md`).

---

## If something's wrong

| Symptom | Fix |
|---|---|
| Login page loads but "can't reach the API" banner | `VITE_API_URL` on Vercel is wrong or has a trailing slash. Fix it, redeploy. |
| Login fails / network error in browser console (CORS) | `CORS_ORIGINS` on Railway doesn't exactly match your Vercel URL. |
| Railway build fails | Deployments → open the log. Check `DATABASE_URL` is the pooler URI with the real password. |
| `/health` works but login says "server error" | Database can't be reached — check the Supabase project isn't paused, and the password in `DATABASE_URL` is right. |
| Everything deployed, want your own users only | Add `SAARTHI_SEED_DEMO` = `0` on Railway to stop creating the 10 demo logins. |

## Changing the code later

Push to your GitHub branch → **both Railway and Vercel redeploy automatically.**
Nothing else to do.

## Running it on your own laptop (no accounts needed)

```bash
python run.py
```

Opens `http://localhost:8000` with a local SQLite database. No env variables,
no internet.
