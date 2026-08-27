-- Enable tenant-scoped Postgres Changes for system operational tables.
-- RLS on each table remains the authorization boundary; the client only uses
-- events as invalidation signals and refetches through the authenticated API.
do $$
declare
  t text;
begin
  foreach t in array array[
    'appointment_checkins',
    'appointment_slots',
    'appointment_waitlists',
    'appointments',
    'branches',
    'channels',
    'conversations',
    'doctors',
    'follow_up_cases',
    'messages',
    'no_show_cases',
    'patients',
    'services',
    'voice_agent_call_logs',
    'voice_agent_configurations',
    'voice_knowledge_sources',
    'voice_operational_settings'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I replica identity full', t);
      begin
        execute format('alter publication supabase_realtime add table public.%I', t);
      exception
        when duplicate_object then null;
        when undefined_object then null;
      end;
    end if;
  end loop;
end
$$;
