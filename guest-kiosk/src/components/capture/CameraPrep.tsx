'use client';

import { useEffect } from 'react';
import { useReadiness } from '@/hooks/useReadiness';
import { PRESETS } from '@/lib/readiness/types';
import { ReadinessChips, FramingGuide } from '@/components/capture/ReadinessChips';
import { AtelierButton } from '@/components/primitives/AtelierButton';
import { ScreenShell } from '@/components/primitives/ScreenShell';
import { useCamera } from '@/lib/camera-context';
import { getEventLine } from '@/lib/event-config';
import { stepNumber, useKioskSession } from '@/lib/kiosk-session';

export function CameraPrep({ onReadyConfirmed }: { onReadyConfirmed: () => void }) {
  const { event, readinessPreset } = useKioskSession();
  const { videoRef, error: camError, startCamera } = useCamera();
  const mode = event.readinessMode;
  const { result, ready } = useReadiness(videoRef, readinessPreset);
  const zone = PRESETS[readinessPreset].zone;

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  useEffect(() => {
    if (mode !== 'auto' || !ready) return;
    const t = setTimeout(onReadyConfirmed, 1500);
    return () => clearTimeout(t);
  }, [mode, ready, onReadyConfirmed]);

  if (camError) {
    return (
      <ScreenShell eventLine={getEventLine(event)} footLine="ERR-CAM-01 · Staff has been notified">
        <p className="font-body text-k-sub text-content-primary text-center max-w-xl">
          The camera is taking a moment. An attendant is on the way — your place in line is saved.
        </p>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      eventLine={getEventLine(event)}
      footLine={`Step ${stepNumber('prep')} of 6`}
    >
      <p className="font-body text-k-body text-content-secondary text-center max-w-xl">
        Stand inside the frame and look toward the lens
      </p>

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
