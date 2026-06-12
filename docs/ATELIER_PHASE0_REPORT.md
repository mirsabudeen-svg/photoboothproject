# Atelier Phase 0 — Install Report

**Date:** June 10, 2026  
**Status:** Complete — **guest platform chosen: Option A (`guest-kiosk/`)**

---

## 1. Framework Detection

This repo has **two frontends** with different stacks:

| Layer | Framework | Styling | Components | Guest vs Operator |
|-------|-----------|---------|------------|-------------------|
| **Android kiosk** (`app/`, `feature/*`) | Kotlin, Jetpack Compose, Hilt | Material3 (`core/designsystem`) | `BigButton`, `CountdownOverlay` | **Guest** (primary) |
| **Admin dashboard** (`admin-dashboard/`) | Next.js 14 App Router | Tailwind 3 + custom tokens | Hand-rolled UI (`Button`, `Card`, `Badge`) | **Operator** |
| **Backend** | NestJS | N/A | N/A | API only |

### Critical finding

The **Atelier kit** (`atelier-kit/`) and **readiness module** (`readiness-module/`) are **React + Tailwind + framer-motion + MediaPipe (browser)**. They target the **S01–S12 guest kiosk flow** described in `CURSOR_MASTER_PROMPT.md`.

The **live guest app today is Android Compose**, not a web kiosk. Phase 0 installed Atelier into **admin-dashboard** as the web foundation. Full guest Atelier migration requires one of:

| Option | Description |
|--------|-------------|
| **A (recommended discuss)** | New `guest-kiosk/` Next.js app using Atelier primitives + readiness module |
| **B** | Port Atelier tokens/primitives to Jetpack Compose (parallel design system) |
| **C** | Admin-only visual migration (operator UI only; guest stays Material3) |

**Readiness module** (Phase 3.5) applies to **web camera prep (S03)** with `getUserMedia` — not directly to Android CameraX without a native MediaPipe port.

---

## 2. Phase 0 Install — Files Placed

### Repo root
| Source | Destination |
|--------|-------------|
| `atelier-kit.zip` | `wedding-photobooth/atelier-kit/` (reference copy) |
| `readiness-module.zip` | `wedding-photobooth/readiness-module/` (Phase 3.5, not installed to src yet) |
| `atelier-kit/.cursorrules` | `wedding-photobooth/.cursorrules` |
| `CURSOR_MASTER_PROMPT.md` | `wedding-photobooth/docs/ATELIER_MASTER_PROMPT.md` |

### Admin dashboard (`admin-dashboard/`)
| Kit file | Installed to |
|----------|--------------|
| `styles/tokens.css` | `src/styles/tokens.css` |
| `tailwind.atelier.ts` | `tailwind.atelier.ts` |
| `lib/motion.ts` | `src/lib/motion.ts` |
| `components/primitives/*` | `src/components/primitives/` (5 components) |

### Config changes
- `src/app/globals.css` — imports `tokens.css` **first** (global `border-radius: 0`, `--surface-base` canvas)
- `tailwind.config.ts` — merged Atelier theme + legacy admin color aliases
- `src/app/layout.tsx` — fonts: **Cormorant Garamond**, **Jost** (replaced DM Sans), **IBM Plex Mono**
- `framer-motion` — already installed ✅

### Build verification
```
npm run build  →  ✓ Compiled successfully (15 routes)
```

**Visual state after Phase 0:** Tokens and fonts load globally; existing admin pages still use legacy component classes (`rounded-2xl`, old gold `#D4A843` in components). Primitives are installed but **not yet wired into screens** — that is Phase 2.

---

## 3. Screen Inventory — S01–S12 Mapping

Atelier spec journey vs **what exists today**:

| Atelier ID | Spec screen | Android route | Admin route | Status |
|------------|-------------|---------------|-------------|--------|
| **S01** | Welcome | `attract` (AttractScreen) | — | ⚠️ Partial — no ambient light drift |
| **S02** | Experience Selection | `capture` MODE_SELECT | — | ⚠️ Photo/GIF/Boomerang only |
| **S03** | Camera Prep | — *missing* | — | ❌ Readiness module not integrated |
| **S04** | Countdown | `capture` COUNTDOWN | — | ⚠️ Overlay only, no CountdownRing |
| **S05** | Capture | `capture` READY + shutter | — | ⚠️ No ivory flash / develop reveal |
| **S06** | Review | `capture` PREVIEW | — | ⚠️ Retake OK; no max-2 counter in footLine |
| **S07** | AI Enhancement | inline in `processCapture` | — | ⚠️ Auto beauty only, no screen |
| **S08** | Layout | `LayoutCompositor` (background) | — | ⚠️ No guest-facing layout screen |
| **S09** | Personalization | — | — | ❌ Not implemented |
| **S10** | Delivery | `share` (ShareScreen) | — | ⚠️ QR/SMS/intents; not Atelier chrome |
| **S11** | Print Queue | `PrintQueueManager` (background) | — | ❌ No guest-facing queue screen |
| **S12** | Success | `share` → Done → attract | — | ⚠️ No dedicated success moment |

### Screens outside S01–S12

| Screen | Platform | Route | Notes |
|--------|----------|-------|-------|
| Pairing | Android | `pairing` | Pre-flow; operator setup |
| Consent | Android | `consent` | Legal gate; not in Atelier map |
| Set PIN | Android | `admin` sub-state | Operator only |
| Operator Admin | Android | `admin` | Device health, unpair |
| Login | Admin | `/login` | Supabase auth |
| Dashboard | Admin | `/` | Operator stats |
| Events list | Admin | `/events` | |
| Create event | Admin | `/events/new` | |
| Event detail | Admin | `/events/[id]` | |
| Devices | Admin | `/devices` | |
| Pair QR | Admin | `/devices/pair` | |
| Public gallery | Admin | `/gallery/[eventId]` | Guest-facing web |
| Analytics | Admin | `/analytics` | Placeholder |
| Settings | Admin | `/settings` | Placeholder |

---

## 4. What Could NOT Be Mapped (needs your decision)

1. **Guest flow target platform** — Apply Atelier to Android Compose (port), new web kiosk app, or admin only?
2. **S03 Camera Prep** — Integrate readiness module on web only, or skip until web kiosk exists?
3. **S07–S09** — Enhancement/Layout/Personalization screens don't exist; spec assumes dedicated steps. Collapse into existing capture→share or build new screens?
4. **Consent screen** — Not in S01–S12. Keep as-is before S02, or merge into Welcome?
5. **Pairing screen** — Pre-S01 operator step. Restyle with Atelier or leave utilitarian?
6. **`.cursorrules` vs `.cursor/rules/`** — Project has 41 agent rules in `.cursor/rules/`. Root `.cursorrules` now holds Atelier design law. Both coexist; confirm precedence.
7. **Firebase reference in master prompt** — This project uses **NestJS + Room**, not Firebase. Event config binds from Room/backend, not Firebase.

---

## 5. Readiness Module (not installed yet)

Per `readiness-module/README.md` — deferred to **Phase 3.5** after Camera Prep target exists:

- Requires `@mediapipe/tasks-vision`
- Local models in `public/models/` (no CDN)
- Replaces S03 body with `<CameraPrep />`
- Graceful degrade if MediaPipe fails

---

## 6. Next Step (awaiting confirmation)

Reply with:

1. **Guest platform choice:** A (new web kiosk) / B (Compose port) / C (admin only)
2. **Proceed to Phase 1** (token sweep on chosen frontend)?
3. Any mapping decisions for items in §4

**Phase 1 will not start until you confirm.**
