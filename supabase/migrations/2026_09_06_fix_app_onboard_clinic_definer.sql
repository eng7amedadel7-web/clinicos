-- Repair the public onboarding entry point. The implementation moved to
-- private.app_onboard_clinic, but the public wrapper was recreated as
-- SECURITY INVOKER, so authenticated callers hit "permission denied for
-- schema private" and every new registration failed to provision its clinic.
-- The wrapper must run as the definer (postgres) to reach the private schema;
-- the founder identity guard lives inside private.app_onboard_clinic itself.
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
security definer
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

revoke all on function public.app_onboard_clinic(text, text, text, text, text, text, jsonb, text, text, text, uuid) from public, anon;
grant execute on function public.app_onboard_clinic(text, text, text, text, text, text, jsonb, text, text, text, uuid) to authenticated;
