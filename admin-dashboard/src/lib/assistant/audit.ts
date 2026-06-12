// Audit trail for every tool execution. Writes to Supabase when configured.

import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { AuditStatus } from './types';

export interface AuditEntry {
  userId: string;
  tool: string;
  args: unknown;
  status: AuditStatus;
  resultSummary?: string;
}

export interface AuditRow {
  id: string;
  tool: string;
  status: string;
  createdAt: string;
  resultSummary?: string;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
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

export async function listAuditForUser(userId: string, limit = 100): Promise<AuditRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('assistant_audit')
    .select('id, tool, status, result_summary, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[assistant-audit] read failed', error);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    tool: row.tool,
    status: row.status,
    createdAt: row.created_at,
    resultSummary: row.result_summary ?? undefined,
  }));
}
