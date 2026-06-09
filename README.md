# Wedding Photobooth MVP

Android-native wedding photobooth vertical MVP with offline-first capture, local QR sharing, ESC/POS printing, and NestJS + R2 cloud sync.

## Structure

```
wedding-photobooth/
├── app/                 # Android shell, navigation, DI
├── core/                # domain, data, database, network, designsystem
├── feature/             # attract, consent, capture, overlay, ai, printing, sharing, sync, admin
├── hardware/            # camera (CameraX), printer (ESC/POS)
├── kiosk/               # Device Owner, Lock Task, boot receiver
├── backend/             # NestJS API + R2 presign
├── admin-dashboard/     # Next.js minimal admin
└── docs/
```

## Quick start

### Android

```bash
cd wedding-photobooth
./gradlew :app:assembleDevDebug
```

Install `app/build/outputs/apk/dev/debug/app-dev-debug.apk` on a tablet (API 26+).

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

### Admin dashboard

```bash
cd admin-dashboard
npm install
npm run dev
```

## Guest flow

Attract → Consent → Capture (photo/GIF/boomerang) → Filter + template → Share (offline QR / SMS queue / intents) → Reset

## Device Owner provisioning

For production kiosk lockdown, provision the tablet as Device Owner via `dpm set-device-owner com.futad.photobooth/.kiosk.KioskDeviceAdminReceiver` (factory reset device, no Google account).

## License

Proprietary — Futad
