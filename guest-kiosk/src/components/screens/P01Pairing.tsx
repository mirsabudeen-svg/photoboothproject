'use client';

import { useState } from 'react';
import { AtelierButton } from '@/components/primitives/AtelierButton';
import { ScreenShell } from '@/components/primitives/ScreenShell';
import { useDeviceSession } from '@/lib/device-session';

export function P01Pairing() {
  const { pair } = useDeviceSession();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [state, setState] = useState<'idle' | 'pairing' | 'error' | 'throttled'>('idle');
  const [message, setMessage] = useState('');

  async function onPair() {
    setState('pairing');
    setMessage('');
    const result = await pair(code.trim(), name.trim() || 'Web Kiosk');
    if (result.ok) return;
    if (result.status === 429) {
      setState('throttled');
      setMessage('Too many attempts — wait a minute and try again.');
    } else {
      setState('error');
      setMessage(
        result.status === 401
          ? 'That pairing code was not accepted.'
          : 'Could not reach the booth server. Check the network and API URL.',
      );
    }
  }

  return (
    <ScreenShell
      eventLine="Operator Setup"
      footLine="Pair this booth — one time only"
    >
      <p className="font-body text-k-body text-content-primary text-center max-w-md">
        Enter the pairing code from your booth admin panel.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Booth name (e.g. Entrance Hall)"
        autoComplete="off"
        className="w-full max-w-md border border-hairline bg-surface-elevated px-4 py-3 font-body text-k-body"
      />
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Pairing code"
        autoComplete="off"
        autoCapitalize="characters"
        className="w-full max-w-md border border-hairline bg-surface-elevated px-4 py-3 font-body text-k-body"
      />
      <AtelierButton
        variant="primary"
        onClick={onPair}
        disabled={state === 'pairing' || code.length < 4}
      >
        {state === 'pairing' ? 'Pairing…' : 'Pair Device'}
      </AtelierButton>
      {message && (
        <p role="alert" className="font-body text-k-meta text-state-error text-center max-w-md">
          {message}
        </p>
      )}
    </ScreenShell>
  );
}
