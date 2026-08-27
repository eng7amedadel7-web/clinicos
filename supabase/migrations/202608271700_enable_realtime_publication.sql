-- Enable Supabase Realtime (WAL) for the core operational tables so the
-- frontend can use postgres_changes as a low-latency invalidation signal.
-- The application treats these events only as "refetch" triggers; row payloads
-- are never trusted client-side (refetches go through the RLS-enforced API).
do $$
declare
  t text;
begin
  foreach t in array array[
    'appointments',
    'conversations',
    'messages',
    'follow_up_cases',
    'no_show_cases',
    'patients',
    'appointment_waitlists'
  ] loop
    if exists (select 1 from pg_class where relname = t) then
      execute format('alter table if exists public.%I replica identity full', t);
      begin
        execute format('alter publication supabase_realtime add table public.%I', t);
      exception
        when duplicate_object then null; -- already in the publication
        when undefined_object then null; -- realtime publication not present
      end;
    end if;
  end loop;
end;
$$;
