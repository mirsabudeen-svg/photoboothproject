// src/lib/assistant/audit.ts
// Audit trail for every tool execution. Writes to Supabase (table SQL in
// supabase/assistant_audit.sql). Degrades to console logging if Supabase is
// not configured — the audit's "optional Supabase" reality — but NEVER blocks
// or fails the user-facing request because logging hiccuped.

import 'server-only';
import { createClient } from '@supabase/supabase-js';

export interface AuditEntry {
  userId: string;
  tool: string;
  args: unknown;
  status: 'executed_read' | 'failed';
  resultSummary?: string;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Service role key so RLS can stay locked down (no client inserts).
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    if (!supabase) {
      console.info('[assistant-audit]', JSON.stringify(entry));
      return;
    }
    await supabase.from('assistant_audit').insert({
      user_id: entry.userId,
      tool: entry.tool,
      args: entry.args,
      status: entry.status,
      result_summary: entry.resultSummary?.slice(0, 500) ?? null,
    });
  } catch (e) {
    console.error('[assistant-audit] write failed', e);
  }
}
