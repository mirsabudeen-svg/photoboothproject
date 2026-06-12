'use client';

import { AtelierButton } from '@/components/primitives/AtelierButton';
import { ScreenShell } from '@/components/primitives/ScreenShell';
import { getEventLine } from '@/lib/event-config';
import { useKioskSession } from '@/lib/kiosk-session';

export function PersonalizationScreen() {
  const { event, goNext } = useKioskSession();

  return (
    <ScreenShell eventLine={getEventLine(event)} footLine="Personalization">
      <p className="font-body text-k-sub text-content-primary text-center max-w-lg">
        Your portrait will carry {event.hashtag || "the evening's mark"}
      </p>
      <AtelierButton variant="primary" onClick={goNext}>
        Continue
      </AtelierButton>
      <AtelierButton variant="skip" onClick={goNext}>
        Skip
      </AtelierButton>
    </ScreenShell>
  );
}
