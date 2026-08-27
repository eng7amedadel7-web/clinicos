-- Atomically create a staff appointment, assign its queue number through the
-- existing appointments trigger, and create the opaque public queue link.
-- The caller supplies the clinic only through the authenticated server session;
-- this function verifies membership and never trusts a browser tenant selector.
create or replace function public.create_appointment_with_queue_link(
  p_clinic_id uuid,
  p_patient_id uuid,
  p_slot_id uuid,
  p_appointment_status text default 'scheduled',
  p_notes text default null,
  p_appointment_type text default 'NEW_VISIT',
  p_create_idempotency_key text default null,
  p_queue_token text default null
)
returns table (
  appointment_id uuid,
  booking_id text,
  booking_number text,
  queue_number integer,
  queue_path text,
  queue_expires_at timestamptz
)
language plpgsql
security definer
set search_path = 'pg_catalog', 'public', 'pg_temp'
as $$
declare
  v_user_id uuid := auth.uid();
  v_patient_clinic_id uuid;
  v_slot_clinic_id uuid;
  v_slot_branch_id uuid;
  v_slot_doctor_id uuid;
  v_slot_service_id uuid;
  v_slot_start timestamptz;
  v_slot_status text;
  v_appointment_id uuid;
  v_booking_id text;
  v_booking_number text;
  v_queue_number integer;
  v_token text := nullif(btrim(p_queue_token), '');
  v_token_hash text;
  v_expires_at timestamptz := now() + interval '7 days';
  v_key text := nullif(btrim(p_create_idempotency_key), '');
begin
  if v_user_id is null then
    raise exception 'Not authenticated.' using errcode = '42501';
  end if;
  if p_clinic_id is null or p_patient_id is null or p_slot_id is null then
    raise exception 'Booking context is incomplete.' using errcode = '22023';
  end if;
  if p_appointment_status not in ('scheduled', 'confirmed', 'pending') then
    raise exception 'Unsupported appointment status.' using errcode = '22023';
  end if;
  if p_appointment_type not in ('NEW_VISIT', 'FOLLOW_UP') then
    raise exception 'Unsupported appointment type.' using errcode = '22023';
  end if;
  if v_key is not null and (length(v_key) < 16 or length(v_key) > 160) then
    raise exception 'Invalid idempotency key.' using errcode = '22023';
  end if;
  if v_token is null then
    v_token := rtrim(translate(encode(gen_random_bytes(32), 'base64'), '+/', '-_'), '=');
  elsif length(v_token) < 40 or length(v_token) > 80 or v_token !~ '^[A-Za-z0-9_-]+$' then
    raise exception 'Invalid queue token.' using errcode = '22023';
  end if;
  if not public.fn_has_clinic_permission(
    p_clinic_id,
    'Appointments',
    'appointments',
    'create'::public.permission_action_enum,
    null
  ) then
    raise exception 'Insufficient clinic permission.' using errcode = '42501';
  end if;

  if v_key is not null then
    perform pg_advisory_xact_lock(hashtextextended(p_clinic_id::text || ':' || v_key, 0));
    select a.id, a.public_id, a.booking_number, a.queue_number
      into v_appointment_id, v_booking_id, v_booking_number, v_queue_number
    from public.appointments a
    where a.clinic_id = p_clinic_id
      and a.create_idempotency_key = v_key
      and a.deleted_at is null
    limit 1;
    if v_appointment_id is not null then
      v_token_hash := encode(digest(v_token, 'sha256'), 'hex');
      select l.expires_at
        into v_expires_at
      from public.public_queue_links l
      where l.booking_id = v_booking_id
        and l.token_hash = v_token_hash
        and l.revoked_at is null
        and l.expires_at > now()
      order by l.created_at desc
      limit 1;

      if v_expires_at is null then
        update public.public_queue_links
        set revoked_at = now()
        where public_queue_links.booking_id = v_booking_id
          and public_queue_links.revoked_at is null;
        v_expires_at := now() + interval '7 days';
        insert into public.public_queue_links (booking_id, token_hash, expires_at, created_by)
        values (v_booking_id, v_token_hash, v_expires_at, v_user_id);
      end if;

      return query select v_appointment_id, v_booking_id, v_booking_number, v_queue_number,
        '/queue/' || v_token,
        v_expires_at;
      return;
    end if;
  end if;

  select p.clinic_id
    into v_patient_clinic_id
  from public.patients p
  where p.id = p_patient_id
    and p.deleted_at is null
  limit 1;
  if v_patient_clinic_id is null or v_patient_clinic_id <> p_clinic_id then
    raise exception 'Patient is not in the current clinic.' using errcode = 'P0002';
  end if;

  select s.clinic_id, s.branch_id, s.doctor_id, s.service_id, s.start_time, s.slot_status
    into v_slot_clinic_id, v_slot_branch_id, v_slot_doctor_id, v_slot_service_id, v_slot_start, v_slot_status
  from public.appointment_slots s
  where s.id = p_slot_id
  for update;
  if v_slot_clinic_id is null or v_slot_clinic_id <> p_clinic_id then
    raise exception 'Slot is not in the current clinic.' using errcode = 'P0002';
  end if;
  if v_slot_status <> 'available' then
    raise exception 'Slot is no longer available.' using errcode = '55P03';
  end if;

  insert into public.appointments (
    clinic_id,
    patient_id,
    doctor_id,
    service_id,
    slot_id,
    branch_id,
    scheduled_at,
    appointment_status,
    booking_source,
    notes,
    appointment_type,
    created_by,
    create_idempotency_key
  ) values (
    p_clinic_id,
    p_patient_id,
    v_slot_doctor_id,
    v_slot_service_id,
    p_slot_id,
    v_slot_branch_id,
    v_slot_start,
    p_appointment_status,
    'manual',
    nullif(btrim(p_notes), ''),
    p_appointment_type,
    v_user_id,
    v_key
  )
  returning id, public_id, booking_number, queue_number
    into v_appointment_id, v_booking_id, v_booking_number, v_queue_number;

  update public.appointment_slots
  set slot_status = 'booked'
  where id = p_slot_id;

  v_token := rtrim(translate(encode(gen_random_bytes(32), 'base64'), '+/', '-_'), '=');
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');
  insert into public.public_queue_links (booking_id, token_hash, expires_at, created_by)
  values (v_booking_id, v_token_hash, v_expires_at, v_user_id);

  return query select v_appointment_id, v_booking_id, v_booking_number, v_queue_number,
    '/queue/' || v_token,
    v_expires_at;
end;
$$;

revoke all on function public.create_appointment_with_queue_link(uuid, uuid, uuid, text, text, text, text, text) from public, anon;
grant execute on function public.create_appointment_with_queue_link(uuid, uuid, uuid, text, text, text, text, text) to authenticated;
