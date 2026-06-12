'use client';

import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[60] bg-surface-elevated border-b border-hairline px-6 py-2 text-center"
      role="status"
    >
      <p className="font-meta uppercase tracking-[0.24em] text-k-meta text-state-processing">
        Offline — photos are being saved and will upload automatically
      </p>
    </div>
  );
}
