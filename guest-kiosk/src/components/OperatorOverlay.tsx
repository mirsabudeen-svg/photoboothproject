'use client';

import { useCallback, useEffect, useState } from 'react';
import { AtelierButton } from '@/components/primitives/AtelierButton';
import { drainer } from '@/lib/queue/drainer';
import { useDeviceSession } from '@/lib/device-session';

const TAP_COUNT = 5;
const TAP_WINDOW_MS = 2_000;

export function OperatorOverlay() {
  const { apiEnabled, unpair } = useDeviceSession();
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [oldestPending, setOldestPending] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [taps, setTaps] = useState(0);
  const [tapTimer, setTapTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const refreshStats = useCallback(async () => {
    const s = await drainer.getQueueStats();
    setStats(s);
    const db = await import('@/lib/queue/db').then((m) => m.dbPromise());
    const all = await db.getAll('captureQueue');
    const pending = all.filter((j) => j.status !== 'done');
    const oldest = pending.length
      ? Math.min(...pending.map((j) => j.createdAt))
      : null;
    setOldestPending(oldest);
    const failed = all.find((j) => j.status === 'failed');
    setLastError(failed?.lastError ?? null);
  }, []);

  useEffect(() => {
    if (!open) return;
    void refreshStats();
    const id = setInterval(() => void refreshStats(), 3_000);
    return () => clearInterval(id);
  }, [open, refreshStats]);

  const onCornerTap = () => {
    if (tapTimer) clearTimeout(tapTimer);
    const next = taps + 1;
    setTaps(next);
    if (next >= TAP_COUNT) {
      setTaps(0);
      setOpen(true);
      return;
    }
    setTapTimer(setTimeout(() => setTaps(0), TAP_WINDOW_MS));
  };

  if (!apiEnabled) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Operator access"
        className="fixed top-0 right-0 z-[70] w-16 h-16 opacity-0"
        onClick={onCornerTap}
      />
      {open && (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-end justify-center p-6">
          <div className="w-full max-w-lg bg-surface-elevated border border-hairline p-6 flex flex-col gap-4">
            <p className="font-meta uppercase tracking-[0.28em] text-k-meta text-gold-deep">
              Queue Status
            </p>
            <pre className="font-mono text-xs text-content-primary whitespace-pre-wrap">
              {JSON.stringify(stats, null, 2)}
            </pre>
            {oldestPending && (
              <p className="font-body text-k-meta text-content-secondary">
                Oldest pending: {Math.round((Date.now() - oldestPending) / 1000)}s ago
              </p>
            )}
            {lastError && (
              <p className="font-body text-k-meta text-state-error break-all">{lastError}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <AtelierButton
                variant="hairline"
                onClick={async () => {
                  const db = await import('@/lib/queue/db').then((m) => m.dbPromise());
                  const failed = await db.getAllFromIndex('captureQueue', 'byStatus', 'failed');
                  for (const job of failed) await drainer.retryFailed(job.id);
                  void refreshStats();
                }}
              >
                Retry Failed
              </AtelierButton>
              <AtelierButton variant="hairline" onClick={() => setOpen(false)}>
                Close
              </AtelierButton>
              <AtelierButton variant="skip" onClick={unpair}>
                Unpair
              </AtelierButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
