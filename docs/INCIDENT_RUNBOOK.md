# Incident Runbook — Private Beta

On-site reference for Kerala wedding events. Full version: host this file in the repo and bookmark on your phone.

## INC-001 — Upload queue stuck

- **Detection:** Safe mode shows >10 queued captures; Sentry `Upload queue stuck`
- **Impact:** Photos saved locally but not in gallery
- **Immediate (60s):** Check venue WiFi; tap **Force sync** on kiosk safe mode; confirm backend `/health` is `ok`
- **Likely causes:** WiFi captive portal · expired device token · R2 credentials
- **Recovery:** Re-pair device if token expired; restart backend container
- **Post-event:** Export WorkManager logs + Sentry breadcrumbs

## INC-002 — Camera black screen

- **Detection:** Preview black after countdown
- **Impact:** Guests cannot capture
- **Immediate:** Reboot kiosk app; check camera permission in Android settings
- **Likely causes:** Permission revoked · USB camera unplugged · CameraX bind failure
- **Recovery:** `adb shell pm grant … CAMERA`; cold restart app

## INC-003 — SMS delivery failures

- **Detection:** BullMQ `sms.failed` > 5 in 10 min; admin shows amber sent / no green delivered
- **Impact:** Guests don't receive SMS links
- **Immediate:** Verify Twilio balance; check `REDIS_URL`; inspect failed jobs
- **Likely causes:** Invalid destination · Twilio 10DLC throttle · Redis down
- **Recovery:** Retry from admin; switch to QR/gallery link sharing

## INC-004 — Print server unreachable

- **Detection:** Printer status error in safe mode; `http://<pi>:8181/health` fails
- **Impact:** No physical prints
- **Immediate:** `sudo systemctl restart photobooth-printer` on Pi; check USB cable
- **Likely causes:** CUPS stopped · wrong companion IP · `PRINT_TOKEN` mismatch
- **Recovery:** Re-enter companion IP in admin mode

## INC-005 — Admin dashboard down

- **Detection:** Dashboard 502/timeout; backend health fails
- **Impact:** Operator blind; kiosk may still capture offline
- **Immediate:** Check backend container logs; verify `DATABASE_URL` and Postgres
- **Recovery:** Roll back last deploy; scale Postgres connection pool if exhausted
