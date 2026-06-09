# Field Test Checklist — Pre-Event

## Device Setup
- [ ] Device paired successfully (QR scan or code entry)
- [ ] Event config synced (check admin dashboard device last-seen)
- [ ] Theme applied (correct colors visible on attract screen)
- [ ] Lock Task mode active (no home/back escape)
- [ ] Admin PIN set (not default; tested unlock + relock)

## Camera
- [ ] Photo capture: countdown → preview → retake → accept → share
- [ ] GIF capture: 5-frame burst → animated preview
- [ ] Boomerang: forward-reverse loop preview
- [ ] Beauty filter visible on capture
- [ ] Template overlay applied from event config

## Sharing
- [ ] QR code resolves (scan from phone on venue WiFi)
- [ ] QR signed URL — expired URL returns 401 (test with QR older than 15 min)
- [ ] SMS: send to real phone, confirm delivery (check Twilio dashboard)
- [ ] WhatsApp intent opens (requires app installed on device)

## Offline Resilience
- [ ] Disable WiFi → capture → share (QR resolves locally)
- [ ] Re-enable WiFi → upload worker fires → admin dashboard shows capture
- [ ] Queue heartbeat visible in device health

## Print (if printer attached)
- [ ] Print job queued after capture
- [ ] Print success confirmed (physical output)
- [ ] Printer error shows in admin device health

## Security
- [ ] `GET /events/:id/config` without token → 401 confirmed
- [ ] `curl http://<device-ip>:8080/media/<id>` without token → 401
- [ ] Old QR (>15 min) → NanoHTTPD returns 401
- [ ] Device token expiry → 401; refresh endpoint issues new token

## Admin Dashboard
- [ ] Dashboard shows live capture count incrementing
- [ ] PDF export downloads with event data
- [ ] Device last-seen updates within 60s of activity
- [ ] Event detail page loads stats and device list

## Post-Event
- [ ] Event ended in admin → device shows no active event
- [ ] Retention sweep via `POST /admin/retention/sweep` returns `{ errors: 0 }`
