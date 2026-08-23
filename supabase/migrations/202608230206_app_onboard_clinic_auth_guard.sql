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
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
begin
  if p_founder_id is null or p_founder_id <> auth.uid() then
    raise exception 'founder identity does not match authenticated user' using errcode = '42501';
  end if;

  return public.founder_onboard_clinic_v3(
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
end;
$$;

revoke all on function public.app_onboard_clinic(text, text, text, text, text, text, jsonb, text, text, text, uuid) from public;
revoke all on function public.app_onboard_clinic(text, text, text, text, text, text, jsonb, text, text, text, uuid) from anon;
grant execute on function public.app_onboard_clinic(text, text, text, text, text, text, jsonb, text, text, text, uuid) to authenticated;
