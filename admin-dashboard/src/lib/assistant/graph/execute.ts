import 'server-only';
import { registry } from '../registry';
import { logAudit } from '../audit';
import type { LlmToolCall } from '../llm';
import type { ToolContext } from '../types';
import type { GraphEmitter } from './state';

export const MAX_TOOL_RESULT_CHARS = 12_000;

export async function executeReadToolCall(
  call: LlmToolCall,
  ctx: ToolContext,
  emit?: GraphEmitter,
): Promise<string> {
  const tool = registry.get(call.function.name);
  if (!tool) {
    return JSON.stringify({ error: `Unknown tool ${call.function.name}` });
  }
  if (tool.mutating) {
    return JSON.stringify({ error: 'Mutating tool routed incorrectly' });
  }

  emit?.('tool_start', { tool: tool.name });
  let args: unknown;
  try {
    args = JSON.parse(call.function.arguments || '{}');
  } catch {
    args = {};
  }
  const parsed = tool.schema.safeParse(args);
  if (!parsed.success) {
    emit?.('tool_end', { tool: tool.name, ok: false });
    return JSON.stringify({ invalid_arguments: parsed.error.flatten() });
  }
  try {
    const result = await tool.execute(parsed.data, ctx);
    const json = JSON.stringify(result).slice(0, MAX_TOOL_RESULT_CHARS);
    emit?.('tool_end', { tool: tool.name, ok: true });
    await logAudit({
      userId: ctx.userId,
      tool: tool.name,
      args: parsed.data,
      status: 'executed_read',
      resultSummary: json.slice(0, 200),
    });
    return json;
  } catch (e) {
    emit?.('tool_end', { tool: tool.name, ok: false });
    await logAudit({
      userId: ctx.userId,
      tool: tool.name,
      args: parsed.data,
      status: 'failed',
      resultSummary: String(e).slice(0, 200),
    });
    return JSON.stringify({ error: String(e) });
  }
}
