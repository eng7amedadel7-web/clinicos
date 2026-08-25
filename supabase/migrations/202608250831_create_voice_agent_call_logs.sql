-- Tenant-scoped operational call log for the MERUNA Voice Agent workspace.
create table if not exists public.voice_agent_call_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  channel_id uuid references public.channels(id) on delete set null,
  provider text not null default 'internal',
  provider_call_id text,
  direction text not null default 'inbound' check (direction in ('inbound', 'outbound', 'test')),
  call_status text not null default 'completed' check (call_status in ('queued', 'ringing', 'in_progress', 'completed', 'missed', 'failed', 'cancelled')),
  outcome text,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  started_at timestamptz,
  ended_at timestamptz,
  call_summary text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, provider, provider_call_id)
);

create index if not exists voice_agent_call_logs_clinic_started_idx
  on public.voice_agent_call_logs (clinic_id, started_at desc nulls last, created_at desc);

create index if not exists voice_agent_call_logs_clinic_status_idx
  on public.voice_agent_call_logs (clinic_id, call_status, created_at desc);

alter table public.voice_agent_call_logs enable row level security;

revoke all on table public.voice_agent_call_logs from anon, authenticated;
grant select on table public.voice_agent_call_logs to authenticated;

drop policy if exists voice_agent_call_logs_select on public.voice_agent_call_logs;
create policy voice_agent_call_logs_select
  on public.voice_agent_call_logs
  for select
  to authenticated
  using (
    public.fn_has_clinic_permission(clinic_id, 'voice', 'overview', 'read'::public.permission_action_enum)
    or public.fn_has_clinic_permission(clinic_id, 'voice', 'agent', 'manage'::public.permission_action_enum)
  );
