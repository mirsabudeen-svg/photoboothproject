import 'server-only';
import { Annotation } from '@langchain/langgraph';
import type { RunnableConfig } from '@langchain/core/runnables';
import type { LlmMessage, LlmToolCall } from '../llm';

export const MAX_STEPS = 8;

export type GraphEmitter = (event: string, data: unknown) => void;

export interface ConfirmResume {
  approved: boolean;
}

export interface ConfirmationInterrupt {
  type: 'confirmation_required';
  tool: string;
  summary: string;
  confirmToken: string;
  args: unknown;
}

export const AssistantGraphState = Annotation.Root({
  messages: Annotation<LlmMessage[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  userId: Annotation<string>({
    reducer: (_, right) => right,
    default: () => '',
  }),
  stepCount: Annotation<number>({
    reducer: (_, right) => right,
    default: () => 0,
  }),
  pendingReadCalls: Annotation<LlmToolCall[]>({
    reducer: (_, right) => right,
    default: () => [],
  }),
  pendingMutatingCalls: Annotation<LlmToolCall[]>({
    reducer: (_, right) => right,
    default: () => [],
  }),
});

export type AssistantGraphStateType = typeof AssistantGraphState.State;

export function getEmitter(config: RunnableConfig): GraphEmitter | undefined {
  return config.configurable?.onEvent as GraphEmitter | undefined;
}

export function getAbortSignal(config: RunnableConfig): AbortSignal | undefined {
  return config.configurable?.abortSignal as AbortSignal | undefined;
}

export function lastAssistantHasToolCalls(messages: LlmMessage[]): boolean {
  const last = messages[messages.length - 1];
  return Boolean(
    last?.role === 'assistant' &&
      last.tool_calls &&
      last.tool_calls.length > 0,
  );
}
