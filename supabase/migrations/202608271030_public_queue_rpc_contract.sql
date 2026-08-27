-- Keep public queue access behind narrowly scoped SECURITY DEFINER RPCs.
-- Staff mutations use the authenticated Supabase JWT and the existing clinic permission gate.
-- The public projection accepts only a SHA-256 token hash and never returns tenant IDs.

create or replace function public.issue_public_queue_link(
  p_appointment_id uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
returns table (booking_id text, queue_number integer)
language plpgsql
security definer
set search_path = 'pg_catalog', 'public', 'pg_temp'
as $$
declare
  v_clinic_id uuid;
  v_booking_id text;
  v_queue_number integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.' using errcode = '42501';
  end if;
  if p_token_hash is null or length(p_token_hash) <> 64 or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid token hash.' using errcode = '22023';
  end if;
  if p_expires_at is null or p_expires_at <= now() or p_expires_at > now() + interval '30 days' then
    raise exception 'Invalid token expiry.' using errcode = '22023';
  end if;

  select a.clinic_id, a.public_id, a.queue_number
    into v_clinic_id, v_booking_id, v_queue_number
  from public.appointments a
  where a.id = p_appointment_id
    and a.deleted_at is null
  limit 1;

  if v_clinic_id is null or v_booking_id is null then
    raise exception 'Appointment not found.' using errcode = 'P0002';
  end if;
  if not public.fn_has_clinic_permission(v_clinic_id, 'Appointments', 'appointments', 'update'::public.permission_action_enum, null) then
    raise exception 'Insufficient clinic permission.' using errcode = '42501';
  end if;

  update public.public_queue_links
  set revoked_at = now()
  where public_queue_links.booking_id = v_booking_id
    and public_queue_links.revoked_at is null;

  insert into public.public_queue_links (booking_id, token_hash, expires_at, created_by)
  values (v_booking_id, p_token_hash, p_expires_at, auth.uid());

  return query select v_booking_id, v_queue_number;
end;
$$;

create or replace function public.revoke_public_queue_link(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = 'pg_catalog', 'public', 'pg_temp'
as $$
declare
  v_clinic_id uuid;
  v_booking_id text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.' using errcode = '42501';
  end if;
  select a.clinic_id, a.public_id
    into v_clinic_id, v_booking_id
  from public.appointments a
  where a.id = p_appointment_id
    and a.deleted_at is null
  limit 1;
  if v_clinic_id is null or v_booking_id is null then
    raise exception 'Appointment not found.' using errcode = 'P0002';
  end if;
  if not public.fn_has_clinic_permission(v_clinic_id, 'Appointments', 'appointments', 'update'::public.permission_action_enum, null) then
    raise exception 'Insufficient clinic permission.' using errcode = '42501';
  end if;

  update public.public_queue_links
  set revoked_at = now()
  where public_queue_links.booking_id = v_booking_id
    and public_queue_links.revoked_at is null;
end;
$$;

create or replace function public.get_public_queue_projection(p_token_hash text)
returns table (
  clinic_name text,
  branch_name text,
  user_name text,
  booking_number text,
  queue_number integer,
  appointment_status text,
  scheduled_at timestamptz,
  updated_at timestamptz,
  people_ahead integer
)
language plpgsql
security definer
set search_path = 'pg_catalog', 'public', 'pg_temp'
as $$
declare
  v_clinic_id uuid;
  v_branch_id uuid;
  v_queue_number integer;
  v_scheduled_at timestamptz;
  v_timezone text;
  v_target_date date;
begin
  if p_token_hash is null or length(p_token_hash) <> 64 or p_token_hash !~ '^[0-9a-f]{64}$' then
    return;
  end if;

  select c.id, b.id, a.queue_number, a.scheduled_at, coalesce(nullif(btrim(c.timezone), ''), 'UTC')
    into v_clinic_id, v_branch_id, v_queue_number, v_scheduled_at, v_timezone
  from public.public_queue_links l
  join public.appointments a on a.public_id = l.booking_id and a.deleted_at is null
  join public.clinics c on c.id = a.clinic_id and c.deleted_at is null
  left join public.branches b on b.id = a.branch_id and b.clinic_id = a.clinic_id and b.deleted_at is null
  where l.token_hash = p_token_hash
    and l.revoked_at is null
    and l.expires_at > now()
  limit 1;

  if v_clinic_id is null or v_scheduled_at is null then
    return;
  end if;

  v_target_date := (v_scheduled_at at time zone v_timezone)::date;

  return query
  with target as (
    select
      c.name as clinic_name,
      b.name as branch_name,
      coalesce(nullif(p.name, ''), nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), ''), 'المستخدم') as user_name,
      a.booking_number,
      a.queue_number,
      a.appointment_status,
      a.scheduled_at,
      a.updated_at
    from public.public_queue_links l
    join public.appointments a on a.public_id = l.booking_id and a.deleted_at is null
    join public.clinics c on c.id = a.clinic_id and c.deleted_at is null
    left join public.patients p on p.id = a.patient_id and p.clinic_id = a.clinic_id and p.deleted_at is null
    left join public.branches b on b.id = a.branch_id and b.clinic_id = a.clinic_id and b.deleted_at is null
    where l.token_hash = p_token_hash
      and l.revoked_at is null
      and l.expires_at > now()
    limit 1
  ), ahead as (
    select count(*)::integer as people_ahead
    from public.appointments a
    where a.clinic_id = v_clinic_id
      and a.deleted_at is null
      and a.queue_number is not null
      and v_queue_number is not null
      and a.queue_number < v_queue_number
      and a.appointment_status = any (array['scheduled', 'confirmed', 'checked_in', 'pending']::text[])
      and (a.scheduled_at at time zone v_timezone)::date = v_target_date
  )
  select target.clinic_name, target.branch_name, target.user_name, target.booking_number,
         target.queue_number, target.appointment_status, target.scheduled_at, target.updated_at,
         ahead.people_ahead
  from target cross join ahead;
end;
$$;

revoke all on function public.issue_public_queue_link(uuid, text, timestamptz) from public, anon;
revoke all on function public.revoke_public_queue_link(uuid) from public, anon;
revoke all on function public.get_public_queue_projection(text) from public;
grant execute on function public.issue_public_queue_link(uuid, text, timestamptz) to authenticated;
grant execute on function public.revoke_public_queue_link(uuid) to authenticated;
grant execute on function public.get_public_queue_projection(text) to anon, authenticated;
