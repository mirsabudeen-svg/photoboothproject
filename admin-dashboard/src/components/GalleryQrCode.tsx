'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export function GalleryQrCode({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !url) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 200,
      color: { dark: '#D4A843', light: '#1A1A1A' },
      errorCorrectionLevel: 'H',
    }).catch(() => undefined);
  }, [url]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} className="rounded-xl" data-testid="gallery-qr" />
      <p className="text-xs text-text-muted break-all max-w-xs text-center font-mono">{url}</p>
    </div>
  );
}
