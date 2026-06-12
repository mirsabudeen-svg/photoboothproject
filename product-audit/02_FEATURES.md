# Complete Feature Inventory

## Core Features

| Feature | Description | User Value | Implementation | Dependencies | Status | Optimization |
|---------|-------------|------------|----------------|--------------|--------|--------------|
| Device Pairing | Operator pairs kiosk with shared code | Fleet registration | `PairingScreen` + `POST /devices/pair` | Backend, `PAIRING_CODE` | ✅ Working | QR scan from admin (manual entry today) |
| Attract Screen | Branded idle screen with tap-to-start | Sets wedding mood | `AttractScreen.kt` — shimmer, couple names, hashtag | Event config in Room | ✅ Working | Video backgrounds, slideshow |
| Photo Consent | Legal consent before capture | GDPR/compliance | `ConsentScreen` + `ConsentViewModel` + Room consent table | Active event required | ✅ Working (fixed) | Server-side consent audit trail |
| Photo Capture | Single photo with countdown | Core photobooth | CameraX + `CaptureViewModel` | Camera permission | ✅ Working | Live beauty preview |
| GIF Capture | 5-frame burst animation | Social delight | Custom GIF89a LZW encoder | CameraX burst | ⚠️ Partial | GIF extension block bug |
| Boomerang | Forward-reverse loop | Trendy social format | 8-frame ping-pong encoder | CameraX burst | ⚠️ Partial | Same encoder issues |
| Retake / Confirm | Preview before accepting | Quality control | `PreviewActions` in CaptureScreen | — | ✅ Working | Side-by-side compare |
| Event Config Sync | Pull theme/consent from cloud | Brand consistency | `EventConfigSyncWorker` (15min) | Device token, backend | ⚠️ Partial | Immediate sync on pair |
| Demo Event Bootstrap | Auto-create event if none synced | Dev/demo reliability | `MainViewModel.ensureActiveEvent()` | Room | ✅ Working | Replace with real sync |
| Offline-First Storage | Captures survive network loss | Venue reliability | Room + idempotency keys | SQLCipher | ✅ Working | — |
| Kiosk Lock Task | Prevent guest exit | Venue security | `KioskModeManager` + Device Admin | Device Owner provisioning | ⚠️ Partial | MDM auto-provision script |
| Boot Auto-Launch | Kiosk restarts after reboot | Uptime | `BootReceiver` | Device Admin | ✅ Working | — |

---

## AI Features

| Feature | Description | User Value | Implementation | Status | Notes |
|---------|-------------|------------|----------------|--------|-------|
| Beauty Filter | Softens skin on photos | Flattering portraits | `BeautyProcessor` — CPU box blur | ⚠️ Stub | TFLite hook commented out |
| Filter Presets | Grayscale, Sepia, Vintage | Creative options | `FilterProcessor` ColorMatrix | ✅ Working | Not exposed in guest UI (auto BEAUTY only) |
| Background Segmentation | Remove/replace background | Premium effect | `BackgroundSegmentationProcessor` | ❌ Placeholder | No TFLite model loaded |
| AI Consent Text | Generate consent copy | Operator speed | GPT-4o-mini via `/api/ai/generate` | ✅ Working | Admin only |
| AI Hashtag | Generate wedding hashtag | Branding assist | Same OpenAI route | ✅ Working | Admin only |
| AI Image Generation | Create overlays/backgrounds | Creative differentiation | — | ❌ Not implemented | — |

---

## Camera Features

| Feature | Implementation | Status |
|---------|----------------|--------|
| CameraX preview | `CaptureViewModel.bindCamera()` | ✅ Working |
| Countdown overlay | `CountdownOverlay` component | ✅ Working |
| Mode selection | Photo / GIF / Boomerang | ✅ Working |
| Front/back camera | Not exposed in UI | ❌ Missing |
| Flash control | Not implemented | ❌ Missing |
| Resolution config | CameraX defaults | ⚠️ Unconfigured |
| Multi-shot | `CaptureType.MULTI_SHOT` in domain | ⚠️ Not in UI |

---

## Social / Sharing Features

| Feature | Channel | Implementation | Status |
|---------|---------|----------------|--------|
| Local QR Share | QR → NanoHTTPD :8080 | HMAC-SHA256 signed URL, 15min TTL | ✅ Working |
| SMS Share | Twilio MMS | `ShareSyncWorker` → `POST /shares` → BullMQ | ⚠️ Partial (worker Hilt issue) |
| WhatsApp Share | Android intent | `IntentSharer.shareWhatsApp()` | ✅ Working (on-device) |
| Email Share | Android intent | `IntentSharer.shareEmail()` | ✅ Working (on-device) |
| Cloud Gallery | Public web page | `GET /gallery/:eventId?token=` | ✅ Working |
| Gallery Publish | Admin action | `POST /events/:id/gallery/publish` | ✅ Working |
| Gallery Download | Proxy route | `/api/gallery/download` | ✅ Working |
| Social channel (backend) | Enum value `SOCIAL` | — | ❌ No handler |

---

## Admin Features

| Feature | Route | Status | Gap |
|---------|-------|--------|-----|
| Dashboard stats | `/` | ✅ Working | No time-series charts |
| Create event | `/events/new` | ✅ Working | — |
| Event list | `/events` | ✅ Working | No edit/delete |
| Event detail | `/events/[id]` | ✅ Working | No capture thumbnails (labels only) |
| Publish gallery | Event detail | ✅ Working | — |
| Device list | `/devices` | ✅ Working | No revoke/delete |
| Pairing QR | `/devices/pair` | ✅ Working | — |
| PDF export | Dashboard | ✅ Working | html2canvas + jsPDF |
| Analytics page | `/analytics` | ❌ Placeholder | Duplicates dashboard |
| Settings | `/settings` | ❌ Placeholder | Read-only env display |
| AI content gen | Create event form | ✅ Working | Requires OpenAI key |
| Camera test preview | Create event | ✅ Working | react-webcam |
| Login | `/login` | ⚠️ Partial | Supabase optional; dev bypass |
| Live realtime | Dashboard | ⚠️ Partial | Supabase postgres_changes |

---

## Analytics Features

| Feature | Where | Status |
|---------|-------|--------|
| PostHog backend events | `capture_completed`, `gallery_viewed`, `share_delivered` | ✅ Working |
| PostHog admin client | `event_created`, `gallery_published` | ✅ Working |
| Analytics batch ingest | `POST /analytics/batch` | ✅ Working |
| Dashboard live counters | Supabase realtime | ⚠️ Requires Supabase |
| Per-event analytics charts | — | ❌ Missing |
| Operator funnel metrics | — | ❌ Missing |
| Crash reporting (kiosk) | `CrashReportingManager` — local files only | ⚠️ Partial |

---

## Printing Features

| Feature | Implementation | Status |
|---------|----------------|--------|
| Print queue (local) | `PrintQueueManager` + Room | ✅ Working |
| Print worker | `PrintWorker` via WorkManager | ⚠️ Partial (Hilt) |
| Template composite | `LayoutCompositor` — postcard layout | ✅ Working |
| ESC/POS direct | `hardware/printer` module | ⚠️ Untested on hardware |
| Companion host (Pi) | Python server :8181 | ⚠️ Implemented; needs Pi test |
| Print token auth | `X-Print-Token` header | ✅ Working |
| Admin printer config | Companion Host IP field | ✅ Working |

---

## Event Features

| Feature | Status | Notes |
|---------|--------|-------|
| Create event (admin) | ✅ | JSONB config: theme, retention, channels, consent |
| Event themes | ⚠️ | 3 themes in admin UI; Android applies `themeId` partially |
| Event config to device | ⚠️ | Sync worker exists; demo bootstrap often used |
| Gallery token rotation | ✅ | On unpublish |
| Retention sweep | ✅ | Cron 2AM + manual `POST /admin/retention/sweep` |
| End event / deactivate | ❌ | No kiosk-side "no active event" flow |
| Multi-event switcher | ❌ | Single active event per device |

---

## Notification Features

| Type | Status |
|------|--------|
| Push notifications (FCM) | ❌ Not implemented |
| SMS delivery webhooks | ✅ Twilio status callback |
| In-app toasts (admin) | ✅ Toast context |
| Kiosk error feedback | ❌ Silent failures common |
| Email notifications | ❌ No worker |

---

## Hidden / Backend-Only Features

| Feature | Purpose |
|---------|---------|
| Idempotent capture upload | Prevents duplicate R2 objects |
| Magic byte validation | Rejects non-image uploads on complete |
| Media variant processing | webp, thumb, print JPEG via sharp |
| Device token refresh | 90-day rotation endpoint |
| Rate limiting | Pairing (3/min), shares (10/min), gallery (60/min) |
| PII scrubbing in retention | Share destinations nulled on sweep |
| PostHog PII scrub | Email/phone stripped before send |

---

## Feature Completion Summary

| Category | Complete | Partial | Missing/Broken |
|----------|----------|---------|----------------|
| Core guest loop | 8 | 3 | 1 |
| AI | 2 | 2 | 2 |
| Camera | 4 | 2 | 3 |
| Sharing | 5 | 2 | 1 |
| Admin | 8 | 3 | 4 |
| Analytics | 3 | 2 | 3 |
| Printing | 3 | 3 | 0 |
| Events | 4 | 2 | 2 |
| Notifications | 2 | 0 | 3 |
| Payment | 0 | 0 | 1 |
