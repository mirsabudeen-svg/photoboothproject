'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AIGenerateButton({
  field,
  eventName,
  eventType,
  onGenerated,
}: {
  field: 'consentText' | 'hashtag' | 'description';
  eventName: string;
  eventType?: string;
  onGenerated: (value: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!eventName || eventName.length < 3) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, eventName, eventType: eventType ?? 'wedding' }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { result?: string };
      if (data.result) onGenerated(data.result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={generate}
      loading={loading}
      type="button"
      className="mt-1.5 text-gold/80 hover:text-gold border-gold/20"
    >
      <Sparkles className="w-3.5 h-3.5" />
      {loading ? 'Generating…' : 'Generate with AI'}
    </Button>
  );
}
