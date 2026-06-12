# Guest Kiosk — Web (Atelier + Readiness)

Luxury wedding photobooth **guest experience** as a Next.js fullscreen web app.

- **Design:** Atelier kit (tokens, primitives, motion)
- **Camera prep:** MediaPipe FaceLandmarker readiness gating (S03)
- **Flow:** S01 Welcome → S12 Success (see `src/components/screens/`)

Runs on **port 3002** (admin uses 3001, backend 3000).

## Quick start

```bash
cd guest-kiosk
npm install
npm run setup:models
# Download face_landmarker.task → public/models/face_landmarker.task
npm run dev
```

Open http://localhost:3002 on a tablet or kiosk browser (Chrome/Edge, HTTPS or localhost for camera).

## Model setup (required for readiness AI)

1. `npm run setup:models` — copies MediaPipe wasm to `public/models/wasm/`
2. Download [face_landmarker.task](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) (float16) to `public/models/face_landmarker.task`

If the model is missing, readiness **degrades gracefully** — capture still works (staff code `READINESS_INIT_FAILED` in logs only).

## Environment

Copy `.env.example` to `.env.local`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend base URL |
| `NEXT_PUBLIC_EVENT_ID` | Event to load config from (optional) |

Without these, the demo wedding event (Aisha & Omar) is used.

## Architecture

| Path | Role |
|------|------|
| `src/components/screens/` | S01–S12 screen components |
| `src/components/primitives/` | Atelier UI primitives |
| `src/components/capture/` | CameraPrep + ReadinessChips |
| `src/lib/kiosk-session.tsx` | Flow state (step, retakes, capture URL) |
| `src/lib/camera-context.tsx` | Shared getUserMedia stream |
| `src/lib/readiness/` | MediaPipe readiness engine |

## vs Android kiosk

This web app is the **Atelier guest UI**. The existing Android app (`app/`) remains the production offline-first kiosk. Long-term you may run one or the other per deployment.

## Next integration steps

- Wire upload to `POST /captures` with device token
- Replace inline QR with signed local media server or R2 URL
- Connect print queue to companion host
