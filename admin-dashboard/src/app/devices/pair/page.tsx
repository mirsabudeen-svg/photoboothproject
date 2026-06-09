'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Card } from '@/components/ui/Card';

export default function PairDevicePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pairingCode = process.env.NEXT_PUBLIC_PAIRING_CODE_DISPLAY ?? 'WEDDING2025';

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, pairingCode, {
      width: 240,
      color: { dark: '#D4A843', light: '#1A1A1A' },
      errorCorrectionLevel: 'H',
    }).catch(() => undefined);
  }, [pairingCode]);

  return (
    <div className="flex flex-col items-center gap-6 py-12 max-w-lg mx-auto">
      <h1 className="font-display text-3xl text-text-primary">Pair a Device</h1>
      <p className="text-text-muted font-sans text-sm text-center">
        Scan this QR from the kiosk app, or enter the code manually on the device.
      </p>
      <Card className="flex flex-col items-center gap-4 p-8 w-full">
        <canvas ref={canvasRef} className="rounded-xl" />
        <code className="text-gold text-2xl font-mono tracking-widest" data-testid="pairing-code">{pairingCode}</code>
      </Card>
    </div>
  );
}
