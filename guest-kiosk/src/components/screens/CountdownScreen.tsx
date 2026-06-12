'use client';

import { CountdownRing } from '@/components/primitives/CountdownRing';
import { ScreenShell } from '@/components/primitives/ScreenShell';
import { useCamera } from '@/lib/camera-context';
import { getEventLine } from '@/lib/event-config';
import { stepNumber, useKioskSession } from '@/lib/kiosk-session';

export function CountdownScreen({ onComplete }: { onComplete: () => void }) {
  const { event } = useKioskSession();
  const { videoRef } = useCamera();

  return (
    <ScreenShell eventLine={getEventLine(event)} footLine={`Step ${stepNumber('countdown')} of 6 · Eyes to the lens`}>
      <div className="relative w-full max-w-[min(86vw,900px)] aspect-[3/4] border border-hairline bg-surface-raised overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-40"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <CountdownRing from={3} onComplete={onComplete} />
        </div>
      </div>
    </ScreenShell>
  );
}
