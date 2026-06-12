// src/lib/assistant/types.ts
// Shared types for the admin AI assistant (Phase A — read-only "Analyst" mode).

import type { z } from 'zod';

/** Context handed to every tool execution on the server. */
export interface ToolContext {
  /** Fetch against the NestJS backend with X-Admin-Api-Key attached server-side. */
  backendFetch: (path: string, init?: RequestInit) => Promise<Response>;
  /** Supabase user id of the operator driving this session (for audit). */
  userId: string;
}

/**
 * Tool definition. Phase A ships read tools only (`mutating: false`).
 * The `mutating` flag exists now so Phase B's confirmation gate is a
 * registry property from day one, not a refactor.
 */
export interface ToolDef<S extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  /** What the LLM sees. Be precise about when to use the tool. */
  description: string;
  /** Validates LLM-produced args BEFORE execution. */
  schema: S;
  mutating: boolean;
  execute: (args: z.infer<S>, ctx: ToolContext) => Promise<unknown>;
}

export class ToolError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ToolError';
  }
}

/** SSE events streamed to the panel. */
export type AssistantEvent =
  | { type: 'token'; text: string }              // streamed answer delta
  | { type: 'tool_start'; tool: string }         // "Checking devices…" affordance
  | { type: 'tool_end'; tool: string; ok: boolean }
  | { type: 'done' }
  | { type: 'error'; text: string };

/** Chat message shape shared by panel and route. */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
