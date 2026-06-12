'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';

interface AuditEntry {
  id: string;
  tool: string;
  status: string;
  createdAt: string;
  resultSummary?: string;
}

export function AssistantActivity() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/assistant/audit')
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((data) => setEntries(data.entries ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-sans text-sm font-medium text-text-muted">Assistant activity</h2>
        <p className="text-text-primary font-sans text-xs mt-1">
          Tool lookups and mutation proposals executed by the AI assistant.
        </p>
      </div>
      {loading && <p className="text-text-muted text-sm">Loading…</p>}
      {!loading && entries.length === 0 && (
        <p className="text-text-muted text-sm">No assistant activity yet.</p>
      )}
      <ul className="space-y-2 max-h-80 overflow-y-auto">
        {entries.map((e) => (
          <li
            key={e.id}
            className="text-xs font-mono border border-border rounded-lg px-3 py-2 text-text-muted"
          >
            <span className="text-gold">{e.tool}</span> · {e.status} ·{' '}
            {new Date(e.createdAt).toLocaleString()}
            {e.resultSummary && (
              <p className="mt-1 text-text-primary truncate">{e.resultSummary}</p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
