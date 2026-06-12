'use client';

import { useEffect, useState } from 'react';
import { ProgressNarrated } from '@/components/primitives/ProgressNarrated';
import { ScreenShell } from '@/components/primitives/ScreenShell';
import { getEventLine } from '@/lib/event-config';
import { useKioskSession } from '@/lib/kiosk-session';

const STAGES = [
  'Queued for print…',
  'Rendered for print',
  'Printing — about 20 seconds',
  'Print complete',
];

export function PrintQueueScreen() {
  const { event, goNext } = useKioskSession();
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    if (stageIdx >= STAGES.length - 1) {
      const t = setTimeout(goNext, 1200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStageIdx((i) => i + 1), 1400);
    return () => clearTimeout(t);
  }, [stageIdx, goNext]);

  return (
    <ScreenShell eventLine={getEventLine(event)} footLine="Print queue">
      <ProgressNarrated
        stage={STAGES[stageIdx]}
        progress={(stageIdx + 1) / STAGES.length}
      />
    </ScreenShell>
  );
}
