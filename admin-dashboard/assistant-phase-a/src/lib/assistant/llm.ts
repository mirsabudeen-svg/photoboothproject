// src/lib/assistant/llm.ts
// Thin provider adapter. Phase A targets the OpenAI key you already have wired
// for /api/ai/generate. Keep everything outside this file provider-agnostic so
// swapping providers later touches only this module.

import 'server-only';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.ASSISTANT_MODEL ?? 'gpt-4o-mini';

export type LlmMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: LlmToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };

export interface LlmToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string }; // arguments = JSON string
}

export type LlmTurn =
  | { kind: 'text'; text: string }
  | { kind: 'tool_calls'; assistantMessage: LlmMessage; calls: LlmToolCall[] };

/**
 * One model turn, streaming.
 * - Text deltas invoke onToken as they arrive.
 * - If the model decides to call tools, we accumulate the (streamed) tool-call
 *   deltas and return them whole — tool calls are not user-visible mid-stream.
 */
export async function llmTurn(
  messages: LlmMessage[],
  tools: unknown[],
  onToken: (text: string) => void,
  signal?: AbortSignal,
): Promise<LlmTurn> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools,
      tool_choice: 'auto',
      stream: true,
      temperature: 0.2,
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => '');
    throw new Error(`LLM error ${res.status}: ${body.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  // tool-call deltas arrive sharded by index
  const calls: Record<number, { id: string; name: string; args: string }> = {};

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') continue;

      let json: any;
      try { json = JSON.parse(payload); } catch { continue; }
      const delta = json.choices?.[0]?.delta;
      if (!delta) continue;

      if (typeof delta.content === 'string' && delta.content.length) {
        text += delta.content;
        onToken(delta.content);
      }
      if (Array.isArray(delta.tool_calls)) {
        for (const tc of delta.tool_calls) {
          const i = tc.index ?? 0;
          calls[i] ??= { id: '', name: '', args: '' };
          if (tc.id) calls[i].id = tc.id;
          if (tc.function?.name) calls[i].name += tc.function.name;
          if (tc.function?.arguments) calls[i].args += tc.function.arguments;
        }
      }
    }
  }

  const callList = Object.values(calls);
  if (callList.length > 0) {
    const toolCalls: LlmToolCall[] = callList.map((c) => ({
      id: c.id,
      type: 'function',
      function: { name: c.name, arguments: c.args || '{}' },
    }));
    return {
      kind: 'tool_calls',
      calls: toolCalls,
      assistantMessage: { role: 'assistant', content: text || null, tool_calls: toolCalls },
    };
  }
  return { kind: 'text', text };
}
