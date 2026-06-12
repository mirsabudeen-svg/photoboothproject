'use client';

import { type ReactNode } from 'react';
import { CameraProvider } from './camera-context';
import { DeviceSessionProvider, useDeviceSession } from './device-session';
import { KioskSessionProvider } from './kiosk-session';
import { P01Pairing } from '@/components/screens/P01Pairing';
import { P02WaitingForEvent } from '@/components/screens/P02WaitingForEvent';
import { OfflineBanner } from '@/components/OfflineBanner';
import { OperatorOverlay } from '@/components/OperatorOverlay';

function GuestShell({ children }: { children: ReactNode }) {
  const { phase, event } = useDeviceSession();

  if (phase === 'pairing') return <P01Pairing />;
  if (phase === 'waiting-event') return <P02WaitingForEvent />;

  return (
    <KioskSessionProvider event={event}>
      <CameraProvider>
        <OfflineBanner />
        <OperatorOverlay />
        {children}
      </CameraProvider>
    </KioskSessionProvider>
  );
}

export function KioskProviders({ children }: { children: ReactNode }) {
  return (
    <DeviceSessionProvider>
      <GuestShell>{children}</GuestShell>
    </DeviceSessionProvider>
  );
}
