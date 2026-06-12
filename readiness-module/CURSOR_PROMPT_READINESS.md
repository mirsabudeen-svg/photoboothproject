# Paste into Cursor Agent (after the Atelier migration phases)

Integrate the readiness detection module in `readiness-module/` into the camera
preparation screen. This is Phase 3.5 of the Atelier migration. Rules in
`.cursorrules` still apply to every edit.

1. INSTALL: `npm i @mediapipe/tasks-vision`. Copy the wasm folder and the
   face_landmarker.task model into `public/models/` exactly as README.md describes.
   Confirm both load from local paths — no CDN URLs anywhere.
2. PLACE: move lib/readiness, hooks/useReadiness.ts, and components/capture/* into
   our source tree, fixing import aliases to match the project.
3. INTEGRATE: replace the existing camera-prep screen's body with the CameraPrep
   reference component, BUT reuse our existing camera service/stream instead of its
   inline getUserMedia if one exists — pass our video element ref into useReadiness.
   Map our experience-selection state to the 'single' | 'couple' | 'group' presets
   (GIF/Boomerang/Video use 'single'; AI Portrait uses its subject count).
4. GATE: the screen's primary "I'm Ready" button must be disabled until `ready` is
   true. Keep mode='manual' as default; expose mode in the event config schema.
5. DEGRADE: verify that if engine init throws, ready resolves true and the flow is
   unblocked — test by renaming the model file. Surface READINESS_INIT_FAILED only
   in the footer staff metadata, never to the guest.
6. DO NOT modify the capture pipeline, countdown logic, or any service code. The
   module only gates entry into the countdown.
7. REPORT: files changed, how the camera stream was wired, FPS impact measured on
   the dev machine (log engine analyze() time over 100 frames).
