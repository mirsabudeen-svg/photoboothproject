import 'server-only';
import { interrupt } from '@langchain/langgraph';
import type { RunnableConfig } from '@langchain/core/runnables';
import { backendFetch } from '../backend';
import { signConfirmToken } from '../confirm';
import { llmTurn, type LlmMessage, type LlmToolCall } from '../llm';
import { logAudit } from '../audit';
import { SYSTEM_PROMPT } from '../prompt';
import { registry } from '../registry';
import { executeReadToolCall, MAX_TOOL_RESULT_CHARS } from './execute';
import {
  getAbortSignal,
  getEmitter,
  lastAssistantHasToolCalls,
  MAX_STEPS,
  type AssistantGraphStateType,
  type ConfirmResume,
  type ConfirmationInterrupt,
} from './state';

function splitToolCalls(calls: LlmToolCall[]) {
  const read: LlmToolCall[] = [];
  const mutating: LlmToolCall[] = [];
  for (const call of calls) {
    const tool = registry.get(call.function.name);
    if (tool?.mutating) mutating.push(call);
    else read.push(call);
  }
  return { read, mutating };
}

export async function agentNode(
  state: AssistantGraphStateType,
  config: RunnableConfig,
): Promise<Partial<AssistantGraphStateType>> {
  if (state.stepCount >= MAX_STEPS) {
    return { pendingReadCalls: [], pendingMutatingCalls: [] };
  }

  const emit = getEmitter(config);
  const convo: LlmMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...state.messages,
  ];

  const turn = await llmTurn(
    convo,
    registry.toOpenAiTools(),
    (text) => emit?.('token', { text }),
    getAbortSignal(config),
  );

  if (turn.kind === 'text') {
    return {
      messages: [{ role: 'assistant', content: turn.text }],
      stepCount: state.stepCount + 1,
      pendingReadCalls: [],
      pendingMutatingCalls: [],
    };
  }

  const { read, mutating } = splitToolCalls(turn.calls);
  return {
    messages: [turn.assistantMessage],
    stepCount: state.stepCount + 1,
    pendingReadCalls: read,
    pendingMutatingCalls: mutating,
  };
}

export async function readToolsNode(
  state: AssistantGraphStateType,
  config: RunnableConfig,
): Promise<Partial<AssistantGraphStateType>> {
  const emit = getEmitter(config);
  const ctx = { backendFetch, userId: state.userId };
  const toolMessages: LlmMessage[] = [];

  for (const call of state.pendingReadCalls) {
    const content = await executeReadToolCall(call, ctx, emit);
    toolMessages.push({ role: 'tool', tool_call_id: call.id, content });
  }

  return {
    messages: toolMessages,
    pendingReadCalls: [],
  };
}

export async function confirmGateNode(
  state: AssistantGraphStateType,
  config: RunnableConfig,
): Promise<Partial<AssistantGraphStateType>> {
  const call = state.pendingMutatingCalls[0];
  if (!call) return { pendingMutatingCalls: [] };

  const emit = getEmitter(config);
  const tool = registry.get(call.function.name);
  if (!tool) {
    return {
      messages: [
        {
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify({ error: `Unknown tool ${call.function.name}` }),
        },
      ],
      pendingMutatingCalls: state.pendingMutatingCalls.slice(1),
    };
  }

  let args: unknown;
  try {
    args = JSON.parse(call.function.arguments || '{}');
  } catch {
    args = {};
  }
  const parsed = tool.schema.safeParse(args);
  if (!parsed.success) {
    emit?.('tool_end', { tool: tool.name, ok: false });
    return {
      messages: [
        {
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify({ invalid_arguments: parsed.error.flatten() }),
        },
      ],
      pendingMutatingCalls: state.pendingMutatingCalls.slice(1),
    };
  }

  const summary = `${tool.name} — ${JSON.stringify(parsed.data)}`;
  const confirmToken = signConfirmToken({
    tool: tool.name,
    args: parsed.data,
    userId: state.userId,
  });

  await logAudit({
    userId: state.userId,
    tool: tool.name,
    args: parsed.data,
    status: 'proposed',
    resultSummary: summary.slice(0, 200),
  });

  emit?.('tool_start', { tool: tool.name });

  const decision = interrupt({
    type: 'confirmation_required',
    tool: tool.name,
    summary,
    confirmToken,
    args: parsed.data,
  } satisfies ConfirmationInterrupt) as ConfirmResume;

  const ctx = { backendFetch, userId: state.userId };

  if (!decision?.approved) {
    await logAudit({
      userId: state.userId,
      tool: tool.name,
      args: parsed.data,
      status: 'denied',
    });
    emit?.('tool_end', { tool: tool.name, ok: false });
    return {
      messages: [
        {
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify({ denied: true, message: 'Operator declined' }),
        },
      ],
      pendingMutatingCalls: state.pendingMutatingCalls.slice(1),
    };
  }

  try {
    const result = await tool.execute(parsed.data, ctx);
    const json = JSON.stringify(result).slice(0, MAX_TOOL_RESULT_CHARS);
    await logAudit({
      userId: state.userId,
      tool: tool.name,
      args: parsed.data,
      status: 'executed_write',
      resultSummary: json.slice(0, 200),
    });
    emit?.('tool_end', { tool: tool.name, ok: true });
    return {
      messages: [{ role: 'tool', tool_call_id: call.id, content: json }],
      pendingMutatingCalls: state.pendingMutatingCalls.slice(1),
    };
  } catch (e) {
    await logAudit({
      userId: state.userId,
      tool: tool.name,
      args: parsed.data,
      status: 'failed',
      resultSummary: String(e).slice(0, 200),
    });
    emit?.('tool_end', { tool: tool.name, ok: false });
    return {
      messages: [
        {
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify({ error: String(e) }),
        },
      ],
      pendingMutatingCalls: state.pendingMutatingCalls.slice(1),
    };
  }
}

export function routeAfterAgent(state: AssistantGraphStateType): string {
  if (state.stepCount >= MAX_STEPS) return '__end__';
  if (!lastAssistantHasToolCalls(state.messages)) return '__end__';
  if (state.pendingReadCalls.length > 0) return 'read_tools';
  if (state.pendingMutatingCalls.length > 0) return 'confirm_gate';
  return '__end__';
}

export function routeAfterReadTools(state: AssistantGraphStateType): string {
  if (state.pendingMutatingCalls.length > 0) return 'confirm_gate';
  return 'agent';
}

export function routeAfterConfirmGate(state: AssistantGraphStateType): string {
  if (state.pendingMutatingCalls.length > 0) return 'confirm_gate';
  return 'agent';
}
