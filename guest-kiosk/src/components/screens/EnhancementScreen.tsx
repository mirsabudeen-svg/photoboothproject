'use client';

import { useEffect } from 'react';
import { AtelierButton } from '@/components/primitives/AtelierButton';
import { ProgressNarrated } from '@/components/primitives/ProgressNarrated';
import { ScreenShell } from '@/components/primitives/ScreenShell';
import { getEventLine } from '@/lib/event-config';
import { useKioskSession } from '@/lib/kiosk-session';

export function EnhancementScreen() {
  const { event, capturedUrl, goNext } = useKioskSession();

  useEffect(() => {
    const t = setTimeout(goNext, 2200);
    return () => clearTimeout(t);
  }, [goNext]);

  return (
    <ScreenShell eventLine={getEventLine(event)} footLine="Enhancement">
      {capturedUrl && (
        <img
          src={capturedUrl}
          alt=""
          className="w-full max-w-md opacity-80 object-contain max-h-[40dvh]"
        />
      )}
      <ProgressNarrated stage="Composing your portrait…" />
      <AtelierButton variant="skip" onClick={goNext}>
        Skip
      </AtelierButton>
    </ScreenShell>
  );
}
