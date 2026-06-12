# Complete Screen Inventory

## Android Kiosk Screens

| Screen | Route | Purpose | Status |
|--------|-------|---------|--------|
| Pairing | `pairing` | First-time device registration | ✅ Working |
| Attract | `attract` | Branded idle / tap to begin | ✅ Working |
| Consent | `consent` | Photo consent agreement | ✅ Working |
| Capture | `capture` | Camera preview + modes | ✅ Working |
| Share | `share` | QR + SMS + intents | ✅ Working |
| Admin — Set PIN | `admin` (sub-state) | First-time operator PIN setup | ✅ Working |
| Admin — Operator | `admin` (sub-state) | Device health, event, unpair | ✅ Working |

---

### Pairing Screen

**File:** `feature/admin/.../PairingScreen.kt`  
**Entry:** App launch when `isPaired == false`

| Element | Type |
|---------|------|
| Title "Pair This Booth" | Text |
| Pairing code input | OutlinedTextField |
| Pair Device button | BigButton |
| Error message | Text (red) |
| Loading spinner | CircularProgressIndicator |

**Interactions:** Enter code → Pair Device → navigates to Attract on success  
**Data:** `POST /devices/pair` via `PairingViewModel`  
**Issues:** No QR scanner (manual entry only); throttle 3/min on backend

---

### Attract Screen

**File:** `feature/attract/.../AttractScreen.kt`  
**Entry:** Default when paired; return from Share "Done"

| Element | Type |
|---------|------|
| Couple names / event name | Animated text |
| Hashtag | Text |
| "TAP TO BEGIN" CTA | Pulsing text |
| Shimmer divider | Animated |
| Hidden admin zone (top-right) | 5-tap gesture |

**Interactions:** Tap body → Consent; 5-tap corner → Admin  
**Data:** `activeEvent` from Room via `MainViewModel`  
**Issues:** Theme colors partially applied; no idle timeout/screensaver

---

### Consent Screen

**File:** `feature/consent/.../ConsentScreen.kt`

| Element | Type |
|---------|------|
| "Photo Consent" heading | Text |
| Consent body text | Scrollable text |
| I Agree | BigButton |
| No Thanks | BigButton (secondary) |

**Interactions:** I Agree → Capture; No Thanks → back to Attract  
**Data:** Event config `consentText`; consent recorded in Room  
**Issues:** No Thanks has no alternative path; no scroll-to-accept requirement

---

### Capture Screen

**File:** `feature/capture/.../CaptureScreen.kt`

| Phase | Elements |
|-------|----------|
| MODE_SELECT | Photo, GIF, Boomerang buttons |
| READY | Camera preview + Capture button |
| COUNTDOWN | CountdownOverlay (3-2-1) |
| PREVIEW | Retake, Use Photo buttons |

**Interactions:** Select mode → Capture → countdown → preview → confirm → Share  
**Data:** CameraX via `CaptureViewModel`; files to app storage  
**Issues:** No flash toggle; beauty not visible until post-process; GIF encoder bug

---

### Share Screen

**File:** `feature/sharing/.../ShareScreen.kt`

| Element | Type |
|---------|------|
| QR code image | Bitmap |
| Phone input (E.164) | OutlinedTextField |
| Send SMS | BigButton |
| WhatsApp | BigButton |
| Email | BigButton |
| Done | BigButton |

**Interactions:** Share channels → Done → Attract  
**Data:** `LocalMediaServer` :8080; `POST /shares` for SMS  
**Issues:** No success/failure feedback for SMS; QR host IP wrong on some emulators

---

### Admin Screens

**Files:** `SetPinScreen.kt`, `AdminScreen.kt`

| Element | Type |
|---------|------|
| PIN entry / set | OutlinedTextField |
| Network status | Text |
| Storage / camera / queues | Text |
| Companion Host IP | OutlinedTextField |
| Create Demo Event | BigButton |
| Unpair / Exit Admin | BigButton |

**Interactions:** 5-tap attract → PIN → unlock → operator panel  
**Data:** `DeviceStatusProvider`, Room, credentials DataStore  
**Issues:** No remote config; battery optimization dialog on every MainActivity start

---

## Admin Dashboard Screens

| Screen | Route | Purpose | Status |
|--------|-------|---------|--------|
| Dashboard | `/` | Stats overview + PDF export | ✅ Working |
| Login | `/login` | Supabase email/password | ⚠️ Optional |
| Events List | `/events` | All events | ✅ Working |
| Create Event | `/events/new` | New event form | ✅ Working |
| Event Detail | `/events/[id]` | Stats, devices, gallery | ✅ Working |
| Devices | `/devices` | Fleet list | ✅ Working |
| Pair Device | `/devices/pair` | QR + pairing code | ✅ Working |
| Analytics | `/analytics` | Charts & insights | ❌ Placeholder |
| Public Gallery | `/gallery/[eventId]` | Guest gallery (no auth) | ✅ Working |
| Settings | `/settings` | Configuration | ❌ Placeholder |

---

### Dashboard (`/`)

**File:** `src/components/dashboard/DashboardPage.tsx`

| Element | Source |
|---------|--------|
| 4 stat cards (captures, shares, devices, events) | `/api/dashboard/stats` |
| Live badge | Supabase realtime |
| Export PDF button | `AnalyticsExport` |
| Quick links | Sidebar nav |

**Issues:** No date range filter; analytics page duplicates this; heavy GSAP + Framer on every load

---

### Create Event (`/events/new`)

| Element | Validation |
|---------|------------|
| Event name | Required |
| Theme selector | 3 themes |
| Bride/groom names | Optional |
| Consent text | Min 20 chars; AI generate |
| Hashtag | AI generate |
| Share channels | Multi-select |
| Retention days | 1–365 |
| Capture mode | Select |
| Camera preview | Optional test |

**Issues:** No draft save; no event templates library

---

### Event Detail (`/events/[id]`)

| Section | Status |
|---------|--------|
| Stats cards | ✅ |
| Device list with live dot | ✅ |
| Recent captures grid | ⚠️ Type labels only, no images |
| Share channel breakdown | ✅ |
| Gallery publish/unpublish | ✅ |
| Gallery QR + copy link | ✅ |
| Retention info | ✅ |

---

### Public Gallery (`/gallery/[eventId]`)

| Element | Notes |
|---------|-------|
| Branded header | Event color |
| Masonry grid | ISR 30s revalidate |
| Infinite scroll | IntersectionObserver, batches of 20 |
| Lightbox | Framer Motion modal |
| Download | Proxy via `/api/gallery/download` |
| Web Share API | No fallback UI |

**Auth:** Gallery token in query string (12-char hex)

---

## Screen Count Summary

| Platform | Total Screens | Working | Partial | Placeholder |
|----------|---------------|---------|---------|-------------|
| Android | 7 | 6 | 1 | 0 |
| Admin | 10 | 7 | 1 | 2 |
| **Total** | **17** | **13** | **2** | **2** |
