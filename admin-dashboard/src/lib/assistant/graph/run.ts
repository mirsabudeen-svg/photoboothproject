import 'server-only';
import { Command } from '@langchain/langgraph';
import type { RunnableConfig } from '@langchain/core/runnables';
import { getAssistantGraph } from './build';
import type { AssistantGraphStateType, ConfirmResume, GraphEmitter } from './state';
import type { LlmMessage } from '../llm';

export interface StreamGraphOptions {
  threadId: string;
  userId: string;
  messages?: LlmMessage[];
  resume?: ConfirmResume;
  emit: GraphEmitter;
  signal?: AbortSignal;
}

function graphConfig(opts: StreamGraphOptions): RunnableConfig {
  return {
    configurable: {
      thread_id: opts.threadId,
      onEvent: opts.emit,
      abortSignal: opts.signal,
    },
  };
}

async function emitInterruptIfPaused(
  threadId: string,
  emit: GraphEmitter,
): Promise<boolean> {
  const graph = await getAssistantGraph();
  const state = await graph.getState({ configurable: { thread_id: threadId } });
  const interrupt = state.tasks?.find((t: { interrupts?: { value: unknown }[] }) => t.interrupts?.length)
    ?.interrupts?.[0]
    ?.value as { type?: string; tool?: string; summary?: string; confirmToken?: string; args?: unknown } | undefined;

  if (interrupt?.type === 'confirmation_required') {
    emit('confirmation_required', {
      threadId,
      tool: interrupt.tool,
      summary: interrupt.summary,
      confirmToken: interrupt.confirmToken,
      args: interrupt.args,
    });
    return true;
  }
  return false;
}

export async function streamAssistantGraph(opts: StreamGraphOptions): Promise<void> {
  const graph = await getAssistantGraph();
  const config = graphConfig(opts);

  const input: Partial<AssistantGraphStateType> | Command = opts.resume
    ? new Command({ resume: opts.resume })
    : {
        messages: opts.messages ?? [],
        userId: opts.userId,
        stepCount: 0,
        pendingReadCalls: [],
        pendingMutatingCalls: [],
      };

  try {
    const stream = await graph.stream(input, {
      ...config,
      streamMode: 'updates',
    });

    for await (const _chunk of stream) {
      if (opts.signal?.aborted) break;
    }

    const paused = await emitInterruptIfPaused(opts.threadId, opts.emit);
    if (!paused) {
      opts.emit('done', {});
    }
  } catch (e) {
    if (opts.signal?.aborted) return;
    const paused = await emitInterruptIfPaused(opts.threadId, opts.emit);
    if (!paused) {
      opts.emit('error', { text: e instanceof Error ? e.message : 'Assistant error' });
    }
  }
}
