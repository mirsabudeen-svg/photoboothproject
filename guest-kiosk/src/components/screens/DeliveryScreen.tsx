'use client';

import { useEffect, useState } from 'react';
import { AtelierButton } from '@/components/primitives/AtelierButton';
import { ProgressNarrated } from '@/components/primitives/ProgressNarrated';
import { ScreenShell } from '@/components/primitives/ScreenShell';
import QRCode from 'qrcode';
import { createSmsShare } from '@/lib/api/shares';
import { credentials } from '@/lib/credentials';
import { getEventLine } from '@/lib/event-config';
import { useDeviceSession } from '@/lib/device-session';
import { drainer } from '@/lib/queue/drainer';
import type { CaptureJob } from '@/lib/queue/db';
import { useKioskSession } from '@/lib/kiosk-session';

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

function guestMessage(job: CaptureJob | null, online: boolean): string {
  if (!job) return 'Saving your photo…';
  if (job.status === 'failed') {
    return "We've kept your photo safe — an attendant will help";
  }
  if (job.status === 'done') {
    if (online && job.galleryUrl) {
      return 'Scan to take your portrait with you';
    }
    return "Saved! It'll appear in the gallery shortly";
  }
  if (['captured', 'creating', 'created', 'uploading'].includes(job.status)) {
    return 'Saving your photo…';
  }
  return "Saved! It'll appear in the gallery shortly";
}

export function DeliveryScreen() {
  const { event, captureJobId, capturedUrl, printRequested, setStep } = useKioskSession();
  const { apiEnabled } = useDeviceSession();
  const [job, setJob] = useState<CaptureJob | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsState, setSmsState] = useState<'idle' | 'sending' | 'queued' | 'offline' | 'error'>('idle');
  const [smsMessage, setSmsMessage] = useState('');
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    if (!captureJobId || !apiEnabled) return;
    return drainer.onJob(captureJobId, setJob);
  }, [captureJobId, apiEnabled]);

  useEffect(() => {
    const target =
      job?.status === 'done' && job.galleryUrl
        ? job.galleryUrl
        : capturedUrl && !apiEnabled
          ? capturedUrl
          : null;
    if (!target) {
      setQrDataUrl(null);
      return;
    }
    if (target.startsWith('data:') && target.length > 2000) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(target, {
      width: 280,
      margin: 1,
      color: { dark: '#0A0908', light: '#F5F0E6' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [job, capturedUrl, apiEnabled]);

  const canSms = Boolean(job?.captureId) && job?.status !== 'failed';

  async function sendSms() {
    const normalized = smsPhone.trim();
    if (!E164_REGEX.test(normalized)) {
      setSmsState('error');
      setSmsMessage("That number doesn't look right — please check and try again");
      return;
    }
    const c = credentials.load();
    if (!c || !job?.captureId) return;

    setSmsState('sending');
    setSmsMessage('');
    const result = await createSmsShare(
      c,
      job.captureId,
      normalized,
      crypto.randomUUID(),
    );
    if (result.ok) {
      const queued = navigator.onLine;
      setSmsState(queued ? 'queued' : 'offline');
      setSmsMessage(
        queued
          ? `Sent! Your photo is on its way to •••${normalized.slice(-4)} 📱`
          : "Saved — we'll send it as soon as we're back online ✓",
      );
    } else {
      setSmsState('error');
      setSmsMessage("Couldn't send right now — try the QR code instead");
    }
  }

  const showProgress =
    apiEnabled &&
    job &&
    !['done', 'failed'].includes(job.status);

  return (
    <ScreenShell eventLine={getEventLine(event)} footLine="Delivery">
      <p className="font-body text-k-body text-content-primary text-center max-w-md">
        {guestMessage(job, online)}
      </p>

      {showProgress && <ProgressNarrated stage="Saving your photo…" />}

      {qrDataUrl && (
        <img
          src={qrDataUrl}
          alt="QR code to download your portrait"
          className="w-[280px] h-[280px]"
        />
      )}

      {apiEnabled && canSms && (
        <>
          <input
            value={smsPhone}
            onChange={(e) => setSmsPhone(e.target.value)}
            placeholder="Phone for SMS (E.164)"
            autoComplete="off"
            className="w-full max-w-md border border-hairline bg-surface-elevated px-4 py-3 font-body text-k-body"
          />
          <AtelierButton
            variant="primary"
            onClick={sendSms}
            disabled={smsState === 'sending' || !smsPhone.trim() || !E164_REGEX.test(smsPhone.trim())}
          >
            {smsState === 'sending' ? 'Sending…' : 'Send SMS'}
          </AtelierButton>
          {smsMessage && (
            <p role="status" className="font-body text-k-meta text-content-primary text-center">
              {smsMessage}
            </p>
          )}
        </>
      )}

      <AtelierButton
        variant="primary"
        onClick={() => setStep(printRequested ? 'print-queue' : 'success')}
      >
        {printRequested ? 'Send to Print' : 'Done'}
      </AtelierButton>
    </ScreenShell>
  );
}
