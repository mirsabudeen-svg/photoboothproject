'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface ToolReceipt {
  name: string;
  ok: boolean | null;
}

interface PendingConfirmation {
  threadId: string;
  tool: string;
  summary: string;
  confirmToken: string;
  resolved?: boolean;
}

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  tools?: ToolReceipt[];
  confirmation?: PendingConfirmation;
}

const TOOL_LABELS: Record<string, string> = {
  list_events: 'Looking up events',
  get_event_detail: 'Reading event detail',
  get_event_stats: 'Reading event stats',
  list_devices: 'Checking the device fleet',
  get_dashboard_stats: 'Gathering workspace stats',
  get_system_health: 'Checking system health',
  diagnose_device: 'Diagnosing booth',
  create_event: 'Creating event',
  publish_gallery: 'Publishing gallery',
  unpublish_gallery: 'Unpublishing gallery',
  unpublish_galleries_batch: 'Unpublishing galleries',
  trigger_retention_sweep: 'Running retention sweep',
};

const SUGGESTIONS = [
  'Which booths are online right now?',
  'How is the latest event performing?',
  'Is the system healthy?',
];

async function consumeSse(
  res: Response,
  handlers: {
    onEvent: (event: string, data: Record<string, unknown>) => void;
  },
) {
  if (!res.body) throw new Error('No response body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

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
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(dataLine.slice(5).trim());
      } catch {
        /* skip */
      }
      handlers.onEvent(event, data);
    }
  }
}

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

  const patchLast = useCallback((fn: (m: Msg) => Msg) => {
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = fn(next[next.length - 1]);
      return next;
    });
  }, []);

  const handleStreamEvent = useCallback(
    (event: string, data: Record<string, unknown>) => {
      if (event === 'token') {
        patchLast((m) => ({ ...m, content: m.content + String(data.text ?? '') }));
      } else if (event === 'tool_start') {
        patchLast((m) => ({
          ...m,
          tools: [...(m.tools ?? []), { name: String(data.tool), ok: null }],
        }));
      } else if (event === 'tool_end') {
        patchLast((m) => ({
          ...m,
          tools: (m.tools ?? []).map((t, i, arr) =>
            i === arr.length - 1 && t.name === data.tool
              ? { ...t, ok: Boolean(data.ok) }
              : t,
          ),
        }));
      } else if (event === 'confirmation_required') {
        setBusy(false);
        patchLast((m) => ({
          ...m,
          confirmation: {
            threadId: String(data.threadId),
            tool: String(data.tool),
            summary: String(data.summary),
            confirmToken: String(data.confirmToken),
          },
        }));
      } else if (event === 'error') {
        patchLast((m) => ({
          ...m,
          content: m.content || `Something went wrong: ${data.text}`,
        }));
      }
    },
    [patchLast],
  );

  const confirmAction = useCallback(
    async (approved: boolean) => {
      let conf: PendingConfirmation | undefined;
      setMessages((prev) => {
        conf = prev[prev.length - 1]?.confirmation;
        return prev;
      });
      if (!conf || conf.resolved) return;

      setBusy(true);
      patchLast((m) => ({
        ...m,
        confirmation: m.confirmation ? { ...m.confirmation, resolved: true } : undefined,
      }));

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/assistant/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            threadId: conf.threadId,
            approved,
            token: approved ? conf.confirmToken : undefined,
          }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Confirm failed (${res.status})`);
        await consumeSse(res, { onEvent: handleStreamEvent });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          patchLast((m) => ({
            ...m,
            content:
              m.content ||
              'Could not complete the confirmation. Check your session and try again.',
          }));
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [handleStreamEvent, patchLast],
  );

  const ask = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;
      setInput('');
      setBusy(true);

      const history = [...messages, { role: 'user' as const, content: question }];
      setMessages([...history, { role: 'assistant', content: '', tools: [] }]);

      const threadId = crypto.randomUUID();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            threadId,
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`Assistant unavailable (${res.status})`);
        await consumeSse(res, { onEvent: handleStreamEvent });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: 'assistant',
              content:
                'The assistant could not be reached. Check that the backend and your API keys are configured.',
            };
            return next;
          });
        }
      } finally {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (!last?.confirmation || last.confirmation.resolved) {
            setBusy(false);
          }
          return prev;
        });
        abortRef.current = null;
      }
    },
    [busy, handleStreamEvent],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Assistant">
      <button
        aria-label="Close assistant"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-xl text-text-primary">Assistant</h2>
            <p className="text-xs text-text-muted">Live answers from your events &amp; fleet</p>
          </div>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-text-muted hover:text-text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          >
            Close
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <div className="space-y-3 pt-6">
              <p className="text-sm text-text-muted">
                Ask anything about your events, booths, or system status.
              </p>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="block w-full rounded border border-border bg-canvas px-3 py-2 text-left text-sm text-text-primary hover:border-gold/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
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
                    ? 'max-w-[85%] rounded-lg bg-gold/15 px-3 py-2 text-sm text-text-primary'
                    : 'max-w-[90%] text-sm text-text-primary'
                }
              >
                {m.role === 'assistant' && (m.tools?.length ?? 0) > 0 && (
                  <ul className="mb-2 space-y-1">
                    {m.tools!.map((t, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-text-muted">
                        <span
                          className={
                            t.ok === null
                              ? 'inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-gold'
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

                {m.confirmation && !m.confirmation.resolved && (
                  <div className="mb-3 rounded border border-gold/40 bg-gold/5 p-3">
                    <p className="text-xs font-medium text-gold">Approval required</p>
                    <p className="mt-1 text-xs text-text-muted">{m.confirmation.summary}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => confirmAction(true)}
                        className="rounded bg-gold px-3 py-1.5 text-xs font-medium text-canvas disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => confirmAction(false)}
                        className="rounded border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text-primary disabled:opacity-50"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                )}

                <div className="whitespace-pre-wrap leading-relaxed">
                  {m.content ||
                    (m.role === 'assistant' && busy && i === messages.length - 1 ? '…' : m.content)}
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
          className="border-t border-border p-4"
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
              className="max-h-32 min-h-[42px] flex-1 resize-y rounded border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded bg-gold px-4 py-2 text-sm font-medium text-canvas transition-opacity disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              Ask
            </button>
          </div>
          <p className="mt-2 text-[10px] text-text-muted">
            Read tools run automatically. Changes require your explicit approval.
          </p>
        </form>
      </aside>
    </div>
  );
}
