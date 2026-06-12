// src/components/assistant/AssistantPanel.tsx
// Right-side slide-over chat panel, styled to the existing dark-luxury system:
// #0F0F0F canvas, #1A1A1A surfaces, #D4A843 gold accent, #F0EDE8 text,
// Cormorant Garamond display / DM Sans body. No new UI deps.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  /** Tool activity receipts rendered above an assistant message. */
  tools?: { name: string; ok: boolean | null }[];
}

const TOOL_LABELS: Record<string, string> = {
  list_events: 'Looking up events',
  get_event_detail: 'Reading event detail',
  get_event_stats: 'Reading event stats',
  list_devices: 'Checking the device fleet',
  get_dashboard_stats: 'Gathering workspace stats',
  get_system_health: 'Checking system health',
  diagnose_device: 'Diagnosing booth',
};

const SUGGESTIONS = [
  'Which booths are online right now?',
  'How is the latest event performing?',
  'Is the system healthy?',
];

export function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;
      setInput('');
      setBusy(true);

      const history = [...messages, { role: 'user' as const, content: question }];
      // user message + empty assistant slot to stream into
      setMessages([...history, { role: 'assistant', content: '', tools: [] }]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`Assistant unavailable (${res.status})`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const patchLast = (fn: (m: Msg) => Msg) =>
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = fn(next[next.length - 1]);
            return next;
          });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let sep: number;
          while ((sep = buffer.indexOf('\n\n')) !== -1) {
            const raw = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            const eventLine = raw.split('\n').find((l) => l.startsWith('event:'));
            const dataLine = raw.split('\n').find((l) => l.startsWith('data:'));
            if (!eventLine || !dataLine) continue;
            const event = eventLine.slice(6).trim();
            let data: any = {};
            try { data = JSON.parse(dataLine.slice(5).trim()); } catch { /* skip */ }

            if (event === 'token') {
              patchLast((m) => ({ ...m, content: m.content + data.text }));
            } else if (event === 'tool_start') {
              patchLast((m) => ({ ...m, tools: [...(m.tools ?? []), { name: data.tool, ok: null }] }));
            } else if (event === 'tool_end') {
              patchLast((m) => ({
                ...m,
                tools: (m.tools ?? []).map((t, i, arr) =>
                  i === arr.length - 1 && t.name === data.tool ? { ...t, ok: data.ok } : t,
                ),
              }));
            } else if (event === 'error') {
              patchLast((m) => ({
                ...m,
                content: m.content || `Something went wrong: ${data.text}`,
              }));
            }
          }
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: 'assistant',
              content: 'The assistant could not be reached. Check that the backend and your API keys are configured.',
            };
            return next;
          });
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, messages],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Assistant">
      {/* scrim */}
      <button
        aria-label="Close assistant"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />
      {/* panel */}
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-[#2A2A2A] bg-[#141414] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#2A2A2A] px-5 py-4">
          <div>
            <h2 className="font-[Cormorant_Garamond,serif] text-xl text-[#F0EDE8]">Assistant</h2>
            <p className="text-xs text-[#8A867E]">Live answers from your events &amp; fleet</p>
          </div>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-[#8A867E] hover:text-[#F0EDE8] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4A843]"
          >
            Close
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <div className="space-y-3 pt-6">
              <p className="text-sm text-[#8A867E]">Ask anything about your events, booths, or system status.</p>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="block w-full rounded border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-left text-sm text-[#CFCBC2] hover:border-[#D4A843]/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4A843]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  m.role === 'user'
                    ? 'max-w-[85%] rounded-lg bg-[#D4A843]/15 px-3 py-2 text-sm text-[#F0EDE8]'
                    : 'max-w-[90%] text-sm text-[#E6E2DA]'
                }
              >
                {m.role === 'assistant' && (m.tools?.length ?? 0) > 0 && (
                  <ul className="mb-2 space-y-1">
                    {m.tools!.map((t, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-[#8A867E]">
                        <span
                          className={
                            t.ok === null
                              ? 'inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#D4A843]'
                              : t.ok
                                ? 'inline-block h-1.5 w-1.5 rounded-full bg-emerald-500'
                                : 'inline-block h-1.5 w-1.5 rounded-full bg-red-500'
                          }
                        />
                        {TOOL_LABELS[t.name] ?? t.name}
                        {t.ok === null ? '…' : ''}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">
                  {m.content || (m.role === 'assistant' && busy && i === messages.length - 1 ? '…' : m.content)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="border-t border-[#2A2A2A] p-4"
        >
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              rows={1}
              placeholder={busy ? 'Working…' : 'Ask about events, booths, health…'}
              disabled={busy}
              className="max-h-32 min-h-[42px] flex-1 resize-y rounded border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 text-sm text-[#F0EDE8] placeholder-[#6B675F] focus:border-[#D4A843] focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded bg-[#D4A843] px-4 py-2 text-sm font-medium text-[#0F0F0F] transition-opacity disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A843]/60"
            >
              Ask
            </button>
          </div>
          <p className="mt-2 text-[10px] text-[#6B675F]">
            Read-only assistant — it can look things up but can't change anything yet.
          </p>
        </form>
      </aside>
    </div>
  );
}
