create schema if not exists private;

alter function public.app_onboard_clinic(
  text, text, text, text, text, text, jsonb, text, text, text, uuid
) set schema private;

create or replace function public.app_onboard_clinic(
  p_organization_name text,
  p_organization_slug text,
  p_clinic_name text,
  p_clinic_slug text,
  p_timezone text default 'Asia/Riyadh'::text,
  p_clinic_type text default 'general'::text,
  p_channels jsonb default '[]'::jsonb,
  p_primary_branch_name text default null::text,
  p_primary_branch_address text default null::text,
  p_primary_branch_phone text default null::text,
  p_founder_id uuid default null::uuid
)
returns jsonb
language sql
security invoker
set search_path to 'pg_catalog', 'public', 'private', 'auth', 'pg_temp'
as $$
  select private.app_onboard_clinic(
    p_organization_name,
    p_organization_slug,
    p_clinic_name,
    p_clinic_slug,
    p_timezone,
    p_clinic_type,
    p_channels,
    p_primary_branch_name,
    p_primary_branch_address,
    p_primary_branch_phone,
    p_founder_id
  );
$$;

revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated;
revoke all on function private.app_onboard_clinic(
  text, text, text, text, text, text, jsonb, text, text, text, uuid
) from public;
revoke all on function private.app_onboard_clinic(
  text, text, text, text, text, text, jsonb, text, text, text, uuid
) from anon;
grant execute on function private.app_onboard_clinic(
  text, text, text, text, text, text, jsonb, text, text, text, uuid
) to authenticated;
revoke all on function public.app_onboard_clinic(
  text, text, text, text, text, text, jsonb, text, text, text, uuid
) from public;
revoke all on function public.app_onboard_clinic(
  text, text, text, text, text, text, jsonb, text, text, text, uuid
) from anon;
grant execute on function public.app_onboard_clinic(
  text, text, text, text, text, text, jsonb, text, text, text, uuid
) to authenticated;

-- These tables are intentionally backend-only. Explicit deny policies make their
-- external inaccessibility visible to policy tooling while preserving service_role access.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'agent_audit_log',
    'appointment_booking_counters',
    'appointment_operation_results',
    'channel_secrets',
    'daily_booking_counters',
    'database_metadata',
    'follow_up_steps',
    'handoff_events',
    'handoff_requests',
    'k2_test_chat_histories',
    'media_files',
    'meruna_system_key',
    'migrations',
    'prompt_versions',
    'staff_invite_tokens',
    'system_config',
    'webhook_processing_log'
  ] loop
    execute format(
      'create policy %I on public.%I for all to anon, authenticated using (false) with check (false)',
      'deny_external_access_' || table_name,
      table_name
    );
  end loop;
end;
$$;

-- These are internal helpers, founder provisioning routines, and test/cleanup RPCs.
-- They are not used by the active web application and must not be callable by a
-- signed-in browser user. RLS policies and server-side jobs can still invoke them.
do $$
declare
  function_name text;
  function_args text;
begin
  foreach function_name in array array[
    'care_journey_process_synthetic_operation_v1',
    'care_journey_run_synthetic_notification_e2e_v1',
    'founder_create_clinic',
    'founder_publish_care_journey_version',
    'founder_retry_automation_outbox',
    'founder_retry_care_journey_event',
    'founder_retry_care_journey_step_run',
    'founder_set_clinic_status',
    'part6_create_clinic_for_organization',
    'part6_create_organization_with_clinic',
    'rpc_cleanup_parent_smoke_fixture',
    'rpc_cleanup_reliability_create'
  ] loop
    for function_args in
      select oidvectortypes(p.proargtypes)
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = function_name
    loop
      execute format(
        'revoke all on function public.%I(%s) from public, anon, authenticated',
        function_name,
        function_args
      );
    end loop;
  end loop;
end;
$$;
