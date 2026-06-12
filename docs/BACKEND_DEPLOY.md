# NestJS Backend — Production Deploy (Render)

The API **cannot** run on Cloudflare Workers (needs long-lived Node, Postgres, Redis, BullMQ, Sharp). **Render** free tier is the simplest path; **Fly.io** works similarly.

## Architecture

```
Android / Admin (Cloudflare)  →  NestJS API (Render)  →  Supabase Postgres
                                      ↓
                               Render Key Value (Redis)
                                      ↓
                               Cloudflare R2 (media)
```

You already have **Supabase** (`nkchzpqqojfelhyrsdbu`) — reuse its Postgres for `DATABASE_URL` instead of provisioning a second database on Render.

---

## Prerequisites

| Item | Where |
|------|--------|
| GitHub repo pushed | `photoboothproject` (monorepo root) |
| `ADMIN_API_KEY` (≥32 chars) | Same value as admin dashboard + `backend/.env` |
| Cloudflare R2 bucket + API token | [R2 dashboard](https://dash.cloudflare.com/) |
| Redis | Render **Key Value** (free) |
| Twilio (SMS) | Trial account **or** placeholder SID until SMS is needed |

---

## Step 1 — Supabase Postgres connection string

1. Supabase → **photoboothproject** → **Connect** → **ORM** / **Connection string**
2. Copy the **URI** (use **Session pooler** for the app; **Direct** only if migrations fail on pooler)
3. Example shape:
   ```
   postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres
   ```

This database will hold TypeORM tables (`events`, `devices`, `captures`, …) alongside `assistant_audit`.

---

## Step 2 — Render Key Value (Redis)

1. [Render Dashboard](https://dashboard.render.com/) → **New +** → **Key Value**
2. Name: `photobooth-redis`, region: **Singapore** or **Oregon** (close to Supabase `ap-southeast-2` if possible)
3. After create, copy **Internal Redis URL** → use as `REDIS_URL`

---

## Step 3 — Cloudflare R2 credentials

1. R2 → bucket `photobooth-media` (or create it)
2. **Manage R2 API Tokens** → Create token with Object Read & Write
3. Note:
   - `R2_ENDPOINT` = `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   - `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
   - `R2_PUBLIC_BASE_URL` = public gallery base (custom domain or worker URL)

---

## Step 4 — Create the Web Service

**Dashboard → New + → Web Service → Connect GitHub → `photoboothproject`**

| Setting | Value |
|---------|--------|
| **Name** | `photobooth-api` |
| **Region** | Singapore / Oregon |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Health Check Path** | `/api/v1/health` |
| **Plan** | Free (spins down after 15 min idle) |

Render sets `PORT` automatically — the app reads `process.env.PORT`.

---

## Step 5 — Environment variables

Set in **Render → photobooth-api → Environment**:

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase connection string (Step 1) |
| `ADMIN_API_KEY` | `JUopbYI0O7zcqNd59DafHK1s63AylTZViLMgt4Gu` (or rotate) |
| `CORS_ORIGINS` | `https://photobooth-admin.mirsabudeen.workers.dev` |
| `PAIRING_CODE` | `WEDDING2025` (or your code) |
| `REDIS_URL` | Render Key Value internal URL |
| `R2_BUCKET` | `photobooth-media` |
| `R2_ENDPOINT` | Your R2 S3 endpoint |
| `R2_ACCESS_KEY_ID` | From R2 token |
| `R2_SECRET_ACCESS_KEY` | From R2 token |
| `R2_PUBLIC_BASE_URL` | Public URL for shared gallery files |
| `APP_BASE_URL` | `https://photobooth-admin.mirsabudeen.workers.dev` |
| `TWILIO_ACCOUNT_SID` | Twilio SID (required at boot — use trial or placeholder `AC00000000000000000000000000000000` until SMS is wired) |
| `TWILIO_AUTH_TOKEN` | Twilio token (can be empty string only if SID is set — set a dummy if not using SMS yet) |
| `TWILIO_FROM_NUMBER` | e.g. `+15550000000` if not sending SMS yet |

Optional: `SENTRY_DSN`, `POSTHOG_API_KEY`, `POSTHOG_HOST`

---

## Step 6 — Run database migrations

After the first successful deploy, open **Render Shell** for `photobooth-api`:

```bash
npm run migration:run
```

Verify:

```bash
npm run migration:show
```

All migrations should show as executed.

---

## Step 7 — Wire the admin dashboard

When Render gives you a URL like `https://photobooth-api.onrender.com`:

1. **Admin** — update `admin-dashboard/.env.production`:
   ```env
   NEXT_PUBLIC_API_URL=https://photobooth-api.onrender.com/api/v1
   BACKEND_API_URL=https://photobooth-api.onrender.com/api/v1
   ```
2. Redeploy admin: `cd admin-dashboard && npm run deploy`
3. **Android** — `gradle.properties`:
   ```properties
   photobooth.apiBaseUrl=https://photobooth-api.onrender.com/api/v1
   ```

---

## Step 8 — Smoke test

```bash
# Health (no auth)
curl https://photobooth-api.onrender.com/api/v1/health

# Events (admin key)
curl -H "x-admin-api-key: YOUR_ADMIN_API_KEY" \
  https://photobooth-api.onrender.com/api/v1/events
```

First request on free tier may take **30–60s** (cold start).

---

## Blueprint (optional IaC)

A `render.yaml` is included at the repo root. To deploy everything via Blueprint:

1. Fill in secret env vars in the Render Dashboard after sync (R2, Twilio, `DATABASE_URL`)
2. Dashboard → **Blueprints** → **New Blueprint Instance** → select repo

---

## Costs

| Service | Typical cost |
|---------|----------------|
| Render Web Service (free) | $0 — cold starts, 15 min spin-down |
| Render Key Value (free) | $0 — small instance limits |
| Supabase Postgres (free) | $0 — within free tier limits |
| Cloudflare R2 | Pay per storage/ops (usually low for photobooth) |
| Twilio SMS | Pay per message when enabled |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Boot crash: missing env | Check Render logs for `Missing required env vars` |
| `CORS_ORIGINS must be set` | Add admin workers URL to `CORS_ORIGINS` |
| Health 503, `db: unreachable` | Wrong `DATABASE_URL` or Supabase IP allowlist |
| Health 503, `redis: unreachable` | Use **internal** Redis URL on Render |
| Migrations fail on pooler | Use Supabase **direct** connection for `migration:run` only |
| `sharp` errors | Render uses Linux x64 — rebuild is automatic on `npm ci` |

---

## Alternatives

- **Fly.io** — `fly launch` in `backend/`, attach Postgres + Upstash Redis
- **Railway** — similar to Render, good DX
- **Local + Cloudflare Tunnel** — dev/demo only; tunnel exposes `localhost:3000` as HTTPS
