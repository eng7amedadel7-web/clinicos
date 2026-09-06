-- Trial activation codes: clinics no longer start a trial automatically.
-- A newly registered clinic can explore its workspace and complete the setup
-- checklist, but live operations stay locked until the clinic redeems a
-- platform-issued trial code. Codes are minted by the platform admin only
-- (service role / SQL editor) and each code activates exactly one clinic.

-- 1. Stop auto-starting trials for every new clinic. Existing
-- clinic_subscriptions rows are left untouched.
drop trigger if exists trg_clinic_trial_subscription on public.clinics;

-- 2. Trial code inventory.
create table if not exists public.trial_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  duration_days integer not null default 14 check (duration_days between 1 and 90),
  -- Optional binding: when set, only the auth user with this email can redeem.
  intended_email text,
  -- unused | used | revoked
  status text not null default 'unused' check (status in ('unused', 'used', 'revoked')),
  used_by_clinic_id uuid references public.clinics (id) on delete set null,
  used_by_user_id uuid,
  used_at timestamptz,
  -- The code itself stops working after this moment (minted with 30 days).
  expires_at timestamptz,
  note text,
  created_by text not null default 'platform-admin',
  created_at timestamptz not null default now()
);

comment on table public.trial_codes is 'Platform-issued free-trial codes; redemption grants clinic_subscriptions trialing status.';

alter table public.trial_codes enable row level security;
-- No RLS policies on purpose: anon/authenticated get nothing. The server
-- reads/writes this table only through the service role or the security
-- definer functions below.

-- 3. Mint a code (platform admin only).
create or replace function public.fn_mint_trial_code(
  p_intended_email text default null,
  p_duration_days integer default 14,
  p_note text default null,
  p_valid_days integer default 30
)
returns text
language plpgsql
security definer
set search_path = 'pg_catalog', 'public', 'pg_temp'
as $$
declare
  v_chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
  v_bytes bytea;
  v_group int;
  v_char int;
begin
  -- Readable unambiguous code: MERUNA-XXXX-XXXX-XXXX without 0/O/1/I/L.
  for attempt in 1..5 loop
    v_code := 'MERUNA-';
    for v_group in 1..3 loop
      v_bytes := gen_random_bytes(4);
      for v_char in 1..4 loop
        v_code := v_code || substr(v_chars, (get_byte(v_bytes, v_char - 1) % length(v_chars)) + 1, 1);
      end loop;
      if v_group < 3 then
        v_code := v_code || '-';
      end if;
    end loop;
    exit when not exists (select 1 from public.trial_codes tc where tc.code = v_code);
  end loop;

  insert into public.trial_codes (code, duration_days, intended_email, expires_at, note)
  values (
    v_code,
    greatest(1, least(90, coalesce(p_duration_days, 14))),
    nullif(lower(trim(coalesce(p_intended_email, ''))), ''),
    now() + make_interval(days => greatest(1, coalesce(p_valid_days, 30))),
    nullif(trim(coalesce(p_note, '')), '')
  );

  return v_code;
end;
$$;

revoke all on function public.fn_mint_trial_code(text, integer, text, integer) from public, anon, authenticated;
grant execute on function public.fn_mint_trial_code(text, integer, text, integer) to service_role;

-- 4. Redeem a code (any authenticated member of a clinic).
create or replace function public.fn_redeem_trial_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_clinic_id uuid;
  v_code_row public.trial_codes%rowtype;
  v_existing text;
  v_existing_trial_ends timestamptz;
  v_trial_ends timestamptz;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'auth_required');
  end if;

  select email into v_user_email from auth.users where id = v_user_id;

  select ur.clinic_id into v_clinic_id
  from public.user_roles ur
  where ur.user_id = v_user_id
    and ur.clinic_id is not null
    and (ur.expires_at is null or ur.expires_at > now())
  limit 1;

  if v_clinic_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_clinic');
  end if;

  if p_code is null or btrim(p_code) = '' then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  select * into v_code_row from public.trial_codes tc where tc.code = upper(btrim(p_code));
  if v_code_row.id is null
    or v_code_row.status <> 'unused'
    or (v_code_row.expires_at is not null and v_code_row.expires_at < now()) then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  if v_code_row.intended_email is not null and lower(coalesce(v_user_email, '')) <> v_code_row.intended_email then
    return jsonb_build_object('ok', false, 'error', 'email_mismatch');
  end if;

  -- One activation per clinic: a live subscription blocks re-redemption.
  select cs.status, cs.trial_ends_at into v_existing, v_existing_trial_ends
  from public.clinic_subscriptions cs
  where cs.clinic_id = v_clinic_id;
  if v_existing is not null
    and (
      v_existing in ('active', 'past_due', 'paused')
      or (v_existing = 'trialing' and v_existing_trial_ends is not null and v_existing_trial_ends > now())
    ) then
    return jsonb_build_object('ok', false, 'error', 'already_active');
  end if;

  v_trial_ends := now() + make_interval(days => v_code_row.duration_days);

  update public.trial_codes
  set status = 'used',
      used_by_clinic_id = v_clinic_id,
      used_by_user_id = v_user_id,
      used_at = now()
  where id = v_code_row.id;

  insert into public.clinic_subscriptions (clinic_id, paddle_subscription_id, plan, billing_interval, status, trial_ends_at)
  values (v_clinic_id, null, 'pro', 'month', 'trialing', v_trial_ends)
  on conflict (clinic_id) do update
    set status = 'trialing',
        trial_ends_at = excluded.trial_ends_at;

  return jsonb_build_object('ok', true, 'trial_ends_at', v_trial_ends, 'duration_days', v_code_row.duration_days);
end;
$$;

revoke all on function public.fn_redeem_trial_code(text) from public, anon;
grant execute on function public.fn_redeem_trial_code(text) to authenticated;
