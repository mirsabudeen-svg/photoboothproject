# ATELIER MIGRATION PLAN
Applying the luxury spec to the existing Cursor-built photobooth, without touching
business logic. Each phase is one Cursor session; commit after each.

## Phase 0 — Install the system (30 min)
1. Drop this kit into the frontend root:
   - `.cursorrules` → project root (Cursor now enforces the spec on every edit)
   - `styles/tokens.css` → import FIRST in your global stylesheet
   - `tailwind.atelier.ts` → merge into `tailwind.config.ts`: `theme: { extend: { ...atelier } }`
   - `lib/motion.ts`, `components/primitives/*` → into `src/`
2. Add fonts (next/font or <link>): Cormorant Garamond 400/500 + italic,
   Jost 300/400/500, IBM Plex Mono 400/500.
3. `npm i framer-motion` if not present.
4. Verify: app renders black with no rounded corners anywhere (tokens.css forces radius 0).

## Phase 1 — Token sweep (1 session)
Cursor prompt: "Following .cursorrules, replace every hardcoded color, font-family,
font-size, shadow and border-radius in src/ with Atelier tokens/Tailwind classes.
Do not change any logic, props, or state. List files changed."
Then manually grep-check: `#[0-9a-fA-F]{3,6}`, `rounded`, `shadow-` in components.

## Phase 2 — Chrome + primitives (1 session)
1. Wrap every screen in `<ScreenShell eventLine footLine>`.
2. Replace all buttons with `<AtelierButton variant>` — enforce ONE primary per screen,
   move skip/back to `variant="skip"` in the foot area.
3. Replace every spinner/loader with `<ProgressNarrated stage>`; write human stage
   copy per async call ("Composing your portrait…", "Rendered for print").
4. Replace option grids with `<SelectionCard>` inside a `cascade` parent.

## Phase 3 — The Moment (1 session)
1. Countdown screen → `<CountdownRing from={3} onComplete={capture} onBeat={chime}>`.
   Dim camera preview to 40% behind it.
2. Capture: ivory `flash` overlay (90ms) → shutter audio → photo enters with `develop`.
3. Review: photo full-bleed, controls in one band — `Keep This` (primary) + `Retake`
   (hairline), max 2 retakes, count shown in footLine.

## Phase 4 — Service layer (1 session)
1. Idle: 45s no-touch → bottom sheet "Still there?" → reset to welcome.
2. Error matrix: wrap services so every failure yields { guestCopy, staffCode, fallback }.
   Printer down → Delivery screen drops Print, QR leads. Network down → local QR,
   queue WhatsApp/Email sends.
3. Persist captures locally BEFORE any network call.

## Phase 5 — Polish + audit (1 session)
1. AnimatePresence at the router level for 450ms screen transitions.
2. Hit-target pass: every interactive ≥ 88px, ≥ 24px gaps.
3. prefers-reduced-motion smoke test; aria-live on countdown and progress.
4. Per-event config (names, monogram, hashtag, enabled experiences) loaded from
   Firebase and bound through ScreenShell + copy.

## Definition of done (per screen)
[ ] Tokens only, radius 0, one gold action
[ ] Copy speaks to the guest, mono metadata in chrome
[ ] Entrance/exit via motion.ts variants
[ ] Async = ProgressNarrated, failure = guest line + staff code + fallback
[ ] 88px targets, aria labels, RTL-safe layout
