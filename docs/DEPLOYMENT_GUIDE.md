# Deployment Guide

## Android

1. Generate release keystore
2. `./gradlew :app:assembleProdRelease`
3. Sign APK with `apksigner`
4. Distribute via Firebase App Distribution or MDM

Flavors: `dev` (10.0.2.2 API), `staging`, `prod`

## Backend (Render / Fly.io)

See **`docs/BACKEND_DEPLOY.md`** for full steps (Supabase Postgres + Render Web Service + Redis + R2).

Quick summary:
1. Postgres → reuse Supabase `DATABASE_URL`
2. Redis → Render Key Value
3. Web Service → root `backend`, build `npm ci && npm run build`, start `npm run start:prod`
4. Run `npm run migration:run` in Render Shell
5. Health: `GET /api/v1/health`

## R2

1. Create bucket `photobooth-media`
2. Configure S3-compatible API credentials
3. Set `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
4. Optional: Cloudflare Worker for public gallery

## Admin dashboard (Cloudflare Workers — recommended, free tier)

See `admin-dashboard/CLOUDFLARE_DEPLOY.md`.

1. Set secrets in Cloudflare (`wrangler secret bulk` or Dashboard)
2. `cd admin-dashboard && npm run deploy`
3. Add the `*.workers.dev` or custom domain to backend `CORS_ORIGINS`

## Admin dashboard (Vercel — optional)

Hobby is $0 but **10s function timeout** breaks the AI assistant; Pro is ~$20/user/month for 60s+ streaming.

## Android

See `docs/ANDROID_DEPLOY.md` for prod API URL, signing, and kiosk provisioning.

## CI (GitHub Actions)

See `.github/workflows/build.yml` — Gradle assemble + unit tests on push.
