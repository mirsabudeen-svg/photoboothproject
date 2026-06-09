# Reality Report — Wedding Photobooth Platform

Generated: 2026-06-08 · Phase 1 reconnaissance

| Area | Item | Status | Notes |
|------|------|--------|-------|
| Backend | `synchronize: false` everywhere | ✅ | `app.module.ts`, `data-source.ts` |
| Backend | Migrations ordered | ✅ | 6 migrations through `AddMissingIndexes` |
| Backend | SmsWorker in module | ✅ | `WorkersModule` |
| Backend | RetentionModule wired | ✅ | Via `RetentionModule` import |
| Backend | No `smsService.send()` in handlers | ✅ | Only `sms.worker.ts` |
| Backend | Sentry before bootstrap | ✅ | `main.ts` |
| Backend | Posthog shutdown | ✅ | `onModuleDestroy` |
| Backend | DeviceTokenGuard on captures/shares | ✅ | Fixed this run |
| Backend | CORS fail-closed | ✅ | Production throws if empty |
| Backend | Rate limit on pair | ✅ | 3/min |
| Backend | Gallery throttle + token regex | ✅ | Fixed this run |
| Backend | BullMQ backoff | ✅ | Exponential 5s, 3 attempts |
| Backend | Presign TTL 900s | ✅ | `r2-storage.service.ts` |
| Android | KioskForegroundService | ✅ | `MainActivity.onCreate` |
| Android | LocalMediaTokenizer timing-safe | ✅ | `MessageDigest.isEqual` |
| Android | GifEncoder off main thread | ✅ | Fixed: `Dispatchers.Default` |
| Android | WorkManager expedited | ✅ | Fixed on upload/share now |
| Android | EncryptedSharedPreferences credentials | ⚠️ | DataStore still used for device token |
| Android | SQLCipher passphrase | ✅ | Keystore-backed |
| Android | Camera runtime permission | ✅ | `MainActivity` |
| Android | Gradle wrapper complete | ⚠️ | CI uses wrapper; local jar may be missing |
| Admin | PostHog root layout | ✅ | |
| Admin | No public OpenAI key | ✅ | |
| Admin | Supabase channel cleanup | ✅ | |
| Admin | Gallery isolated from auth | ✅ | |
| Companion | Raw bytes POST | ✅ | |
| Companion | DNP USB path | ✅ | `setup.sh` |
| Companion | Threading + auth | ✅ | Fixed this run |
| CI | Android test job | ✅ | |
| CI | Backend DATABASE_URL | ✅ | |
| CI | Admin E2E port 3000 | ✅ | |

**Fix targets addressed in this optimisation run:** DeviceTokenGuard, gallery security, health/redis/version, companion hardening, GIF encoding thread, WorkManager expedited, gallery lazy-load + download proxy, share status UI, indexes migration.

**Remaining ⚠️:** Migrate `DeviceCredentialsStore` to EncryptedSharedPreferences; regenerate full Gradle wrapper locally.
