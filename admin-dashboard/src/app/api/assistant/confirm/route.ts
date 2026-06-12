// Resume a paused LangGraph thread after HMAC-verified operator approval/denial.

import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireAdminSession } from '@/lib/auth';
import { verifyConfirmToken } from '@/lib/assistant/confirm';
import { getAssistantGraph } from '@/lib/assistant/graph/build';
import { streamAssistantGraph } from '@/lib/assistant/graph/run';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let session: { userId: string };
  try {
    session = await requireAdminSession();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  let body: { threadId?: string; approved?: boolean; token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const { threadId, approved, token } = body;
  if (!threadId) {
    return NextResponse.json({ error: 'threadId required' }, { status: 400 });
  }

  const graph = await getAssistantGraph();
  const config = { configurable: { thread_id: threadId } };
  const state = await graph.getState(config);
  const interrupt = state.tasks?.find((t: { interrupts?: { value: unknown }[] }) => t.interrupts?.length)
    ?.interrupts?.[0]
    ?.value as
    | { tool?: string; args?: unknown; confirmToken?: string }
    | undefined;

  if (!interrupt?.tool) {
    return NextResponse.json({ error: 'No pending confirmation' }, { status: 409 });
  }

  if (approved) {
    if (!token) {
      return NextResponse.json({ error: 'token required for approval' }, { status: 400 });
    }
    const valid = verifyConfirmToken(token, {
      tool: interrupt.tool,
      args: interrupt.args,
      userId: session.userId,
    });
    if (!valid) {
      return NextResponse.json({ error: 'Invalid or expired confirmation token' }, { status: 403 });
    }
  }

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
          userId: session.userId,
          resume: { approved: Boolean(approved) },
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
    },
  });
}
