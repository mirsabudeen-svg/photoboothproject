'use client';
/**
 * CameraPrep — S03 reference implementation.
 * Wires video → useReadiness → FramingGuide + ReadinessChips → gated primary action.
 *
 * Two operating modes (event-configurable):
 *  - manual: "I'm Ready" enables only when ready (default — guests keep control)
 *  - auto:   when ready holds, auto-advances after a 1.5s grace beat
 */
import { useEffect, useRef, useState } from 'react';
import { useReadiness } from '@/hooks/useReadiness';
import { PRESETS } from '@/lib/readiness/types';
import { ReadinessChips, FramingGuide } from '@/components/capture/ReadinessChips';
import { AtelierButton } from '@/components/primitives/AtelierButton';
import { ScreenShell } from '@/components/primitives/ScreenShell';

export function CameraPrep({
  experience, // 'single' | 'couple' | 'group'
  mode = 'manual',
  onReadyConfirmed, // → advance to Countdown (S04)
}: {
  experience: keyof typeof PRESETS;
  mode?: 'manual' | 'auto';
  onReadyConfirmed: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camError, setCamError] = useState(false);
  const { result, ready } = useReadiness(videoRef, experience);
  const zone = PRESETS[experience].zone;

  // camera attach (replace with your existing camera service if present)
  useEffect(() => {
    let stream: MediaStream;
    navigator.mediaDevices
      .getUserMedia({ video: { width: 1920, height: 1080, facingMode: 'user' } })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setCamError(true));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  // auto mode: grace beat then advance
  useEffect(() => {
    if (mode !== 'auto' || !ready) return;
    const t = setTimeout(onReadyConfirmed, 1500);
    return () => clearTimeout(t);
  }, [mode, ready, onReadyConfirmed]);

  if (camError) {
    // error doctrine: guest line + staff code in foot + flow continues if possible
    return (
      <ScreenShell eventLine="One moment" footLine="ERR-CAM-01 · Staff has been notified">
        <p className="font-body text-k-sub text-content-primary text-center max-w-xl">
          The camera is taking a moment. An attendant is on the way —
          your place in line is saved.
        </p>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      eventLine={`${experience === 'single' ? 'Portrait' : experience === 'couple' ? 'Couple Portrait' : 'Group Portrait'}`}
      footLine="Step 2 of 6"
    >
      <div className="relative w-full max-w-[min(86vw,900px)] aspect-[3/4] border border-hairline-strong bg-surface-raised overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        />
        <FramingGuide zone={zone} pass={result.signals.framing === 'pass'} />
        {ready && (
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-meta uppercase tracking-[0.26em] text-k-meta text-state-success whitespace-nowrap">
            ● Perfectly framed
          </span>
        )}
      </div>

      <ReadinessChips result={result} />

      {mode === 'manual' && (
        <AtelierButton
          variant="primary"
          disabled={!ready}
          aria-disabled={!ready}
          style={{ opacity: ready ? 1 : 0.4, transition: 'opacity 250ms var(--ease-luxe)' }}
          onClick={onReadyConfirmed}
        >
          I&apos;m Ready
        </AtelierButton>
      )}
    </ScreenShell>
  );
}
