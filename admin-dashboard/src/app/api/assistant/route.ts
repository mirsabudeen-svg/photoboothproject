// LangGraph-backed assistant: thin SSE wrapper around the compiled graph.

import { NextRequest } from 'next/server';
import { AuthError, requireAdminSession } from '@/lib/auth';
import { streamAssistantGraph } from '@/lib/assistant/graph/run';
import type { ChatMessage } from '@/lib/assistant/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_HISTORY = 24;

export async function POST(req: NextRequest) {
  let user: { userId: string };
  try {
    user = await requireAdminSession();
  } catch (e) {
    if (e instanceof AuthError) {
      return new Response('Unauthorized', { status: 401 });
    }
    return new Response('Server error', { status: 500 });
  }

  let body: { messages?: ChatMessage[]; threadId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const history = (body.messages ?? [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-MAX_HISTORY);
  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    return new Response('Last message must be from the user', { status: 400 });
  }

  const threadId = body.threadId ?? crypto.randomUUID();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );

      try {
        await streamAssistantGraph({
          threadId,
          userId: user.userId,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          emit: send,
          signal: req.signal,
        });
      } catch (e) {
        send('error', { text: e instanceof Error ? e.message : 'Assistant error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Assistant-Thread-Id': threadId,
    },
  });
}
