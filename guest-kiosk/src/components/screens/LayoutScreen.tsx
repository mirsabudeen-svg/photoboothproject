'use client';

import { useEffect, useState } from 'react';
import { AtelierButton } from '@/components/primitives/AtelierButton';
import { ProgressNarrated } from '@/components/primitives/ProgressNarrated';
import { ScreenShell } from '@/components/primitives/ScreenShell';
import { getEventLine } from '@/lib/event-config';
import { useKioskSession } from '@/lib/kiosk-session';

export function LayoutScreen() {
  const { event, capturedUrl, goNext } = useKioskSession();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 1800);
      setProgress(p);
      if (p >= 1) {
        clearInterval(id);
        setTimeout(goNext, 400);
      }
    }, 80);
    return () => clearInterval(id);
  }, [goNext]);

  return (
    <ScreenShell eventLine={getEventLine(event)} footLine="Layout">
      {capturedUrl && (
        <img
          src={capturedUrl}
          alt=""
          className="w-full max-w-md object-contain max-h-[40dvh]"
          style={{ boxShadow: '0 24px 60px rgba(0,0,0,.6)' }}
        />
      )}
      <ProgressNarrated stage="Rendered for print" progress={progress} />
      <AtelierButton variant="skip" onClick={goNext}>
        Skip
      </AtelierButton>
    </ScreenShell>
  );
}
