-- Explicit forgot-password validation: the owner requires a clear rejection
-- when the entered email is not registered. GoTrue's /auth/v1/recover silently
-- ignores unknown emails (anti-enumeration default), so the server needs a
-- fast, service-role-only existence check against auth.users. Accepting the
-- enumeration trade-off deliberately per product decision (documented in the
-- forgot-password route).
create or replace function public.fn_email_registered(p_email text)
returns boolean
language sql
security definer
set search_path to 'pg_catalog', 'auth', 'pg_temp'
as $$
  select exists (
    select 1 from auth.users
    where lower(email) = lower(btrim(coalesce(p_email, '')))
  );
$$;

revoke all on function public.fn_email_registered(text) from public, anon, authenticated;
grant execute on function public.fn_email_registered(text) to service_role;
