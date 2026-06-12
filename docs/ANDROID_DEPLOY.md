# Android Photobooth — Production Deploy

The booth app runs **on the venue tablet**, not in the cloud. Production work is: point it at your live API, sign a release APK, install, and provision kiosk lockdown.

## Prerequisites

- Live NestJS API over **HTTPS** (Render free, Fly.io, or home server + Cloudflare Tunnel)
- R2 bucket configured on the backend (captures upload via presigned URLs)
- `PAIRING_CODE` set on the backend for device pairing
- Release keystore (create once, back up safely)

## 1. Set the production API URL

Do **not** commit real URLs in `build.gradle.kts`. Set them in `gradle.properties` at the repo root (create from `gradle.properties.example`):

```properties
photobooth.apiBaseUrl=https://api.yourdomain.com/api/v1
photobooth.stagingApiBaseUrl=https://staging-api.yourdomain.com/api/v1
```

Flavors read these values in `app/build.gradle.kts`:

| Flavor | Use |
|--------|-----|
| `dev` | Emulator → `10.0.2.2:3000` (unchanged) |
| `staging` | Pre-prod API |
| `prod` | Venue / production API |

Rebuild after changing URLs — the value is baked into the APK at compile time.

## 2. Create a release keystore (one time)

```bash
keytool -genkey -v -keystore photobooth-release.keystore -alias photobooth \
  -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore outside the repo. Add signing config to `app/build.gradle.kts` or use environment variables in CI (do not commit passwords).

## 3. Build production APK

```bash
cd wedding-photobooth
./gradlew :app:assembleProdRelease
```

Output: `app/build/outputs/apk/prod/release/app-prod-release.apk` (unsigned unless signing is configured).

Sign with `apksigner` if not configured in Gradle:

```bash
apksigner sign --ks photobooth-release.keystore app-prod-release.apk
```

## 4. Install on tablets

| Method | When to use |
|--------|-------------|
| USB + `adb install` | Single device / dev |
| MDM (Intune, etc.) | Multiple venue tablets |
| Firebase App Distribution | Beta field tests |

## 5. Device Owner kiosk (production venues)

Factory-reset the tablet (no Google account on device), then:

```bash
adb shell dpm set-device-owner com.futad.photobooth/.kiosk.KioskDeviceAdminReceiver
```

See root `README.md` for lock-task behavior.

## 6. Pairing at the venue

1. Ensure tablet has Wi‑Fi to your API
2. Open admin pairing screen on the booth (or use pairing flow in app)
3. Enter the backend `PAIRING_CODE`
4. Confirm device appears in admin dashboard → Devices

## 7. Offline behavior

- Capture, consent, and local QR share work **without** cloud
- Uploads queue in Room DB; WorkManager syncs when network returns
- Event config refreshes periodically when online

## 8. Cloudflare / free hosting notes

| Piece | Where it runs |
|-------|----------------|
| Android APK | Tablet only |
| API | Your NestJS host (not Cloudflare Workers without a rewrite) |
| Media uploads | Direct to **R2** (presigned URLs from API) |
| Admin dashboard | Cloudflare Workers/Pages (operators only; booths ignore it) |

The tablet only needs `photobooth.apiBaseUrl` to resolve to your API. Putting the API behind **Cloudflare DNS/proxy** or **Tunnel** is fine as long as TLS and CORS allow the app.

## Checklist

- [ ] `photobooth.apiBaseUrl` set in `gradle.properties`
- [ ] Backend migrations applied; `ADMIN_API_KEY` ≥ 32 chars
- [ ] `CORS_ORIGINS` includes admin URL (not required for native app)
- [ ] Prod APK signed and installed
- [ ] Device Owner provisioned (if kiosk mode)
- [ ] Pairing tested; test capture syncs to R2
