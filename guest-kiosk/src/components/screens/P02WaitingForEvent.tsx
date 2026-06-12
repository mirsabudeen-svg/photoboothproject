'use client';

import { useState } from 'react';
import { AtelierButton } from '@/components/primitives/AtelierButton';
import { ProgressNarrated } from '@/components/primitives/ProgressNarrated';
import { ScreenShell } from '@/components/primitives/ScreenShell';
import { useDeviceSession } from '@/lib/device-session';

export function P02WaitingForEvent() {
  const { refreshEventConfig } = useDeviceSession();
  const [retrying, setRetrying] = useState(false);

  async function onRetry() {
    setRetrying(true);
    await refreshEventConfig();
    setRetrying(false);
  }

  return (
    <ScreenShell
      eventLine="Waiting for Event"
      footLine="Operator — assign an event in admin"
    >
      <p className="font-body text-k-body text-content-primary text-center max-w-md">
        This booth is paired but no event configuration is available yet. Create or
        assign an event, then retry.
      </p>
      <ProgressNarrated stage={retrying ? 'Checking for event…' : 'Standing by'} />
      <AtelierButton variant="primary" onClick={onRetry} disabled={retrying}>
        {retrying ? 'Checking…' : 'Retry'}
      </AtelierButton>
    </ScreenShell>
  );
}
