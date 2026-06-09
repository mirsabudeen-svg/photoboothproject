# Audit Fixes Changelog

Applied during production audit (June 7, 2026). No git commits created per project policy.

## Android

| File | Change |
|------|--------|
| `PhotoboothNavHost.kt` | Wire `CaptureResult`; SMS phone state; single navigation path |
| `MainViewModel.kt` | Single `processCapture`; rehydrate QR server; `scheduleUploadNow` |
| `CaptureViewModel.kt` | Remove duplicate save; expose `CaptureResult` |
| `CaptureScreen.kt` | Callback signature; remove duplicate `LaunchedEffect` |
| `ShareScreen.kt` | SMS phone `OutlinedTextField`; disable SMS if blank |
| `SyncScheduler.kt` | Add `scheduleUploadNow()` / `scheduleShareNow()` |
| `PrintWorker.kt` | Read bitmap path from job |
| `PrintQueueManager.kt` / `PrintScheduler.kt` | Schedule print workers |
| `CaptureDao` / `CaptureRepository` | `getCapturesForEvent` for restart rehydration |
| `MainActivity.kt` | Runtime CAMERA permission request |
| `AndroidManifest.xml` | Network security config reference |
| `network_security_config.xml` | Cleartext permitted for LAN QR (kiosk) |

## Backend

| File | Change |
|------|--------|
| `sharing.service.ts` | Restored service; nullable destination |
| `share.entity.ts` | `destination` nullable |
| `admin-api-key.guard.ts` | New admin route protection |
| `analytics/*` | Batch ingest endpoint + entity + module |
| `health.controller.ts` | Liveness endpoint |
| `events.controller.ts` | Admin guard on list/create/stats |
| `events.service.ts` | `getStats()` capture/share counts |
| `events.module.ts` | Import capture/share repositories |
| `app.module.ts` | Analytics + health |
| `main.ts` | Configurable `CORS_ORIGINS` |
| `.env.example` | `ADMIN_API_KEY`, `CORS_ORIGINS`, `NODE_ENV` |

## Admin Dashboard

| File | Change |
|------|--------|
| `src/lib/api.ts` | Server-side admin headers |
| `src/app/api/events/route.ts` | Proxy POST with server API key |
| `src/app/page.tsx` | Real aggregate stats |
| `src/app/events/page.tsx` | Use shared fetch |
| `src/app/events/new/page.tsx` | Proxy route for create |
| `.env.example` | New file |

## Build Verification

| Component | Result |
|-----------|--------|
| Backend `npm run build` | **PASS** |
| Admin `npm run build` | **PASS** |
| Android Gradle | **Not verified** |
