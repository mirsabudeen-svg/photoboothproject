-- Audit trail for assistant tool executions. Run in the Supabase SQL editor.
-- Inserts happen server-side with the service-role key, so RLS stays locked.

create table if not exists public.assistant_audit (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  tool varchar(64) not null,
  args jsonb not null default '{}',
  status varchar(16) not null,          -- executed_read | executed_write | proposed | denied | failed
  result_summary text,
  created_at timestamptz not null default now()
);

create index if not exists idx_assistant_audit_user_time
  on public.assistant_audit (user_id, created_at desc);

alter table public.assistant_audit enable row level security;

create policy "assistant_audit_read_authenticated"
  on public.assistant_audit for select
  to authenticated
  using (true);
