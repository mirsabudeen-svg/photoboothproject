'use client';
/**
 * useReadiness — drives ReadinessEngine on requestAnimationFrame.
 *
 * const { result, ready } = useReadiness(videoRef, 'couple', { paused });
 *
 * `ready` flips true only after all required signals hold for the preset's holdMs.
 * Feed `ready` into the prep screen's primary button and/or auto-advance.
 */
import { useEffect, useRef, useState } from 'react';
import { ReadinessEngine } from '@/lib/readiness/engine';
import { PRESETS, type ReadinessResult } from '@/lib/readiness/types';

const IDLE: ReadinessResult = {
  signals: {
    faces: 'pending', framing: 'pending', lighting: 'pending',
    eyes: 'pending', stability: 'pending',
  },
  ready: false,
  faceCount: 0,
  hint: 'Starting camera…',
};

export function useReadiness(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  preset: keyof typeof PRESETS,
  opts: { paused?: boolean } = {},
) {
  const [result, setResult] = useState<ReadinessResult>(IDLE);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<ReadinessEngine | null>(null);

  useEffect(() => {
    let raf = 0;
    let alive = true;
    const engine = new ReadinessEngine(preset);
    engineRef.current = engine;

    engine
      .init()
      .then(() => {
        const loop = (t: number) => {
          if (!alive) return;
          const video = videoRef.current;
          if (video && !opts.paused) {
            // throttle UI state to ~10Hz; analysis itself is cheap
            const r = engine.analyze(video, t);
            setResult((prev) =>
              prev.ready !== r.ready ||
              prev.hint !== r.hint ||
              JSON.stringify(prev.signals) !== JSON.stringify(r.signals)
                ? r
                : prev,
            );
          }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      })
      .catch((e) => {
        // graceful degradation: booth still works without AI gating
        console.error('[readiness] init failed', e);
        setError('READINESS_INIT_FAILED');
        setResult({ ...IDLE, ready: true, hint: null }); // never block capture
      });

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, opts.paused]);

  return { result, ready: result.ready, hint: result.hint, error };
}
