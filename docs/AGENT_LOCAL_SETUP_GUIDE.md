# Wedding Photobooth — Local Setup Guide (for Claude Agent)

> **How to use this document**  
> Share this entire file with a Claude agent. The agent should walk the user through **one section at a time**, wait for confirmation at each checkpoint, and troubleshoot before moving on. Do not skip prerequisites or env configuration.

---

## Agent instructions

You are helping the user run the **Wedding Photobooth** platform locally on their machine.

**Your role:**
1. Ask which OS they use (Windows / macOS / Linux) and adapt commands.
2. Run or guide commands in order: **Docker → Backend → Admin → Android** (optional: Companion host).
3. After each section, verify the **Pass check** before continuing.
4. If something fails, use the **Troubleshooting** section and fix before proceeding.
5. Clearly separate **required for minimal local dev** vs **optional for full feature testing**.

**Repository root:**
```
wedding-photobooth/
├── backend/           # NestJS API (port 3000)
├── admin-dashboard/   # Next.js admin (port 3001)
├── app/               # Android kiosk app
├── companion-host/    # Raspberry Pi print server (optional)
├── docker-compose.yml # Postgres, Redis, RabbitMQ, MinIO
└── docs/
```

**Port map (local dev):**

| Service | URL / Port |
|---------|------------|
| Backend API | http://localhost:3000/api/v1 |
| Backend health | http://localhost:3000/api/v1/health |
| Admin dashboard | http://localhost:3001 |
| Guest gallery | http://localhost:3001/gallery/:eventId?token=... |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |
| Android emulator → host | `10.0.2.2:3000` (dev flavor default) |

---

## Prerequisites

Confirm the user has:

| Tool | Purpose | Verify command |
|------|---------|--------------|
| **Docker Desktop** | Postgres + Redis | `docker --version` |
| **Node.js 20+** | Backend + admin | `node --version` |
| **npm** | Package installs | `npm --version` |
| **Git** | Clone / updates | `git --version` |
| **Android Studio** | Emulator or USB device | Optional for Android |
| **JDK 17+** | Gradle / Android builds | Android Studio bundles JBR |

**Windows notes:**
- Use **PowerShell**; chain commands with `;` not `&&` if needed.
- Set `JAVA_HOME` to Android Studio JBR if Gradle fails:
  ```powershell
  $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
  ```
- Gradle may be at `%USERPROFILE%\tools\gradle-8.9\bin` if installed manually.

**Pass check:** All required tools report versions without errors.

---

## Section 1 — Infrastructure (Docker)

### 1.1 Start core services

From repo root:

```bash
cd wedding-photobooth
docker compose up -d postgres redis
```

Only **postgres** and **redis** are required for local dev. RabbitMQ and MinIO in `docker-compose.yml` are optional (BullMQ uses Redis, not RabbitMQ).

### 1.2 Verify containers

```bash
docker compose ps
```

**Expected:** `postgres` and `redis` status **running**.

### 1.3 Database credentials (Docker)

| Variable | Value |
|----------|--------|
| Host | `localhost` |
| Port | `5432` |
| Database | `photobooth` |
| User | `dev` |
| Password | `dev` |
| Connection string | `postgresql://dev:dev@localhost:5432/photobooth` |

> **Important:** `backend/.env.example` shows `postgres:postgres` — for **docker compose**, use `dev:dev` as above.

**Pass check:** `docker compose ps` shows healthy postgres.

---

## Section 2 — Backend (NestJS API)

### 2.1 Install dependencies

```bash
cd backend
npm install
```

### 2.2 Create environment file

```bash
cp .env.example .env        # macOS/Linux
copy .env.example .env      # Windows
```

### 2.3 Minimum `.env` for local dev

Edit `backend/.env`:

```env
PORT=3000
NODE_ENV=development

# Must match docker-compose postgres service
DATABASE_URL=postgresql://dev:dev@localhost:5432/photobooth

REDIS_URL=redis://localhost:6379

# Shared secret — must match admin-dashboard
ADMIN_API_KEY=change-me-in-production

# Device pairing code — must match admin display + Android input
PAIRING_CODE=WEDDING2025

# Admin runs on 3001
CORS_ORIGINS=http://localhost:3001
APP_BASE_URL=http://localhost:3001

# Required at startup (can be placeholders until upload testing)
R2_BUCKET=photobooth-media
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_BASE_URL=https://share.yourdomain.com

# Optional until SMS testing
TWILIO_ACCOUNT_SID=placeholder
TWILIO_AUTH_TOKEN=placeholder
TWILIO_FROM_NUMBER=

# Optional
SENTRY_DSN=
POSTHOG_API_KEY=
POSTHOG_HOST=https://app.posthog.com
```

**What works without real R2/Twilio:**
- Health check, pairing, event CRUD, gallery publish API
- Device auth, capture API stubs

**What needs real credentials:**
- Photo upload to cloud storage
- SMS delivery via BullMQ worker
- Guest gallery images from R2 URLs

### 2.4 Run database migrations

```bash
npm run migration:show    # list pending
npm run migration:run     # apply all
```

**Never** set `synchronize: true` — schema changes are migrations only.

### 2.5 Start backend

```bash
npm run start:dev
```

### 2.6 Verify backend

Open: http://localhost:3000/api/v1/health

**Expected JSON (approximate):**
```json
{
  "status": "ok",
  "db": "ok",
  "redis": "ok",
  "version": "1.0.0",
  "queues": { "sms": { "waiting": 0, "active": 0, "failed": 0 } }
}
```

**Pass check:** Health returns `200` with `db: ok` and `redis: ok`.

### 2.7 Backend commands reference

| Command | Purpose |
|---------|---------|
| `npm run build` | Production compile |
| `npm test` | Unit tests |
| `npm run migration:run` | Apply migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run start:prod` | Run compiled build |

---

## Section 3 — Admin Dashboard (Next.js)

### 3.1 Install dependencies

```bash
cd admin-dashboard
npm install
```

### 3.2 Create environment file

```bash
cp .env.example .env.local     # macOS/Linux
copy .env.example .env.local # Windows
```

### 3.3 Minimum `.env.local` for local dev

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
ADMIN_API_KEY=change-me-in-production
NEXT_PUBLIC_PAIRING_CODE_DISPLAY=WEDDING2025
```

**Must match backend:** `ADMIN_API_KEY`, pairing code display = `PAIRING_CODE`.

### 3.4 Optional integrations

Leave blank to skip; features degrade gracefully:

| Variable | Feature if set |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Login required; realtime dashboard stats |
| `OPENAI_API_KEY` | AI consent text generation on event create |
| `NEXT_PUBLIC_POSTHOG_KEY` | Product analytics |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Gallery download proxy (if using R2) |

**Without Supabase:** middleware skips auth — dashboard opens directly at `/`.

### 3.5 Start admin (port 3001)

Backend uses port **3000**, so run admin on **3001**:

```bash
npm run dev -- -p 3001
```

### 3.6 Verify admin

| URL | Expected |
|-----|----------|
| http://localhost:3001 | Dashboard home with stat cards |
| http://localhost:3001/events | Events list |
| http://localhost:3001/events/new | Create event form |
| http://localhost:3001/devices/pair | Pairing QR + code `WEDDING2025` |
| http://localhost:3001/login | Login (or auto-redirect if no Supabase) |

**Pass check:** Dashboard loads; creating an event succeeds (check Network tab for `POST /api/events` → 201).

### 3.7 Admin routes map

| Route | Purpose |
|-------|---------|
| `/` | Dashboard stats + PDF export |
| `/events` | List events |
| `/events/new` | Create event (theme, consent, share channels) |
| `/events/[id]` | Event detail, publish gallery, devices, shares |
| `/devices` | Paired kiosk list |
| `/devices/pair` | Operator pairing helper |
| `/gallery/[eventId]?token=` | Public guest gallery (no auth) |
| `/analytics` | Analytics page |
| `/settings` | Settings |
| `/login` | Supabase auth (optional) |

---

## Section 4 — Android Kiosk App

### 4.1 Prerequisites

- Android Studio with SDK 35
- Emulator (API 26+) **or** physical tablet (USB debugging)
- Repo root: `wedding-photobooth/`

### 4.2 API URL per target

The **dev** flavor sets `API_BASE_URL` in `app/build.gradle.kts`:

| Target | API_BASE_URL |
|--------|----------------|
| **Emulator** | `http://10.0.2.2:3000/api/v1/` (default — no change) |
| **Physical device** | `http://<YOUR_PC_LAN_IP>:3000/api/v1/` |

To find PC IP (Windows):
```powershell
ipconfig
# Look for IPv4 under Wi-Fi adapter, e.g. 192.168.1.42
```

Edit `app/build.gradle.kts` dev flavor, then rebuild:
```kotlin
buildConfigField("String", "API_BASE_URL", "\"http://192.168.1.42:3000/api/v1/\"")
```

> Device and PC must be on the **same Wi-Fi**. Windows Firewall may block port 3000 — allow Node.js if pairing fails.

### 4.3 Build and install

```bash
cd wedding-photobooth

# Windows — set Java if needed
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

.\gradlew.bat :app:installDevDebug
```

Or in Android Studio: open project → Run `app` with **devDebug** variant.

**APK output:** `app/build/outputs/apk/dev/debug/app-dev-debug.apk`

### 4.4 First launch flow

1. **Pairing screen** — enter `WEDDING2025` (same as backend `PAIRING_CODE`)
2. **Attract screen** — “TAP TO BEGIN”
3. **Consent** → **Capture** → **Share** → back to attract

**Admin access on device:** tap top-right corner **5 times** → PIN screen.

### 4.5 Verify Android ↔ backend

1. Pair device successfully
2. Admin → **Devices** — new device appears
3. **last seen** updates when kiosk is active

**Pass check:** Pairing succeeds; device visible in admin.

### 4.6 Gradle troubleshooting

| Issue | Fix |
|-------|-----|
| `gradle-wrapper.jar` missing | Run `gradle wrapper --gradle-version 8.9` from repo root |
| `JAVA_HOME not set` | Point to Android Studio `jbr` folder |
| Build fails on `libs.lifecycle` / catalog | Check `gradle/libs.versions.toml` for missing aliases |
| Emulator can't reach API | Confirm `10.0.2.2:3000` and backend running |

---

## Section 5 — Companion Print Host (optional)

For DNP printer testing via Raspberry Pi:

```bash
cd companion-host
# On the Pi:
sudo bash setup.sh
```

- Print server: `http://<pi-ip>:8181/health`
- Set `PRINT_TOKEN` env on Pi; store token in kiosk **Admin → Companion Host IP**

Configure Android admin screen with Pi IP (e.g. `192.168.1.50`).

---

## Section 6 — End-to-end smoke test

Run after Sections 1–3 (and 4 if testing Android):

| Step | Action | Verify |
|------|--------|--------|
| 1 | `docker compose up -d postgres redis` | Containers running |
| 2 | `npm run migration:run` in backend | No pending migrations |
| 3 | `npm run start:dev` in backend | `/health` → ok |
| 4 | `npm run dev -- -p 3001` in admin | Dashboard loads |
| 5 | Create event at `/events/new` | Event in list |
| 6 | Open event → **Publish gallery** | Gallery URL + QR |
| 7 | Open gallery URL in browser | Public page loads |
| 8 | Pair Android with `WEDDING2025` | Device in admin |
| 9 | Capture photo on kiosk | Share screen with QR |
| 10 | (If R2 configured) Wait for sync | Capture in gallery |

---

## Section 7 — Environment validation script

From repo root (Git Bash on Windows):

```bash
bash scripts/check-env.sh
```

Set variables in the shell or load from `backend/.env` first. Required for backend startup:
- `DATABASE_URL`
- `REDIS_URL`
- `PAIRING_CODE`
- `R2_BUCKET`
- `TWILIO_ACCOUNT_SID`
- `ADMIN_API_KEY`

---

## Section 8 — Troubleshooting

### Backend won't start

- **Missing env vars:** backend exits with list of missing keys — fill `backend/.env`
- **DB connection refused:** `docker compose up -d postgres`; check `DATABASE_URL` uses `dev:dev`
- **Redis unreachable:** `docker compose up -d redis`; check `REDIS_URL`
- **CORS errors from admin:** `CORS_ORIGINS` must include `http://localhost:3001`

### Admin API errors (401 / 500)

- `ADMIN_API_KEY` must **match exactly** in `backend/.env` and `admin-dashboard/.env.local`
- `NEXT_PUBLIC_API_URL` must be `http://localhost:3000/api/v1` (no trailing path errors)

### Android pairing fails

- Backend running and health OK
- Correct `API_BASE_URL` for emulator vs physical device
- Same network (physical device)
- Windows Firewall allows inbound on port 3000
- `PAIRING_CODE` matches entered code

### Gallery empty after captures

- Gallery must be **published** in event detail
- Captures need **R2 upload** to complete — placeholder R2 won't store files
- Check backend logs for upload / media processing errors

### SMS not delivered

- Real Twilio credentials in `backend/.env`
- Redis running (BullMQ SMS worker)
- Check `/health` → `queues.sms.failed`

### Migrations fail

```bash
cd backend
npm run migration:show
# If DB is fresh, migration:run should apply all from src/migrations/
```

---

## Section 9 — Feature vs dependency matrix

| Feature | Requires |
|---------|----------|
| Dashboard + event CRUD | Backend + admin only |
| Device pairing | Backend + matching `PAIRING_CODE` |
| Guest gallery page | Published event + valid token |
| Cloud capture sync | Real Cloudflare R2 credentials |
| SMS share | Twilio + Redis + R2 (for media URL) |
| Offline QR share | Android only (local HTTP server) |
| Admin login | Supabase env vars |
| AI consent text | `OPENAI_API_KEY` |
| Analytics | PostHog keys (optional) |
| Physical print | Companion host on Pi |

---

## Section 10 — Quick reference commands

**Start everything (4 terminals):**

```bash
# Terminal 1 — infra
docker compose up -d postgres redis

# Terminal 2 — backend
cd backend && npm run migration:run && npm run start:dev

# Terminal 3 — admin
cd admin-dashboard && npm run dev -- -p 3001

# Terminal 4 — android (optional)
cd wedding-photobooth && ./gradlew.bat :app:installDevDebug
```

**Stop:**

```bash
docker compose down
# Ctrl+C in backend and admin terminals
```

---

## Agent closing checklist

Before telling the user setup is complete, confirm:

- [ ] http://localhost:3000/api/v1/health returns ok
- [ ] http://localhost:3001 loads admin dashboard
- [ ] User can create an event
- [ ] User can publish a gallery (URL generated)
- [ ] (Optional) Android pairs with `WEDDING2025`
- [ ] User knows which features need R2/Twilio for full testing

Point the user to `docs/FIELD_TEST_CHECKLIST.md` for feature-by-feature QA after setup.

---

*Wedding Photobooth MVP — local setup guide for agent-assisted onboarding*
