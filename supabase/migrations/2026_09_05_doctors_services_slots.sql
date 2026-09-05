-- =============================================================================
-- Doctors, services, and appointment slots — additive schema documentation.
--
-- EVIDENCE (code, not live DB): all three tables ALREADY EXIST in the live
-- Supabase database. They are heavily referenced by the API but were never
-- captured in repo migrations, which is why clinic calendar setup was missing:
--
--   doctors            → artifacts/api-server/src/routes/appointments.ts:59
--                        (select id, name, specialization + filters clinic_id,
--                        deleted_at is null, is_active = true, order name.asc)
--                        operations.ts:52 adds is_active to the select list.
--   services           → appointments.ts:60 (id, name, duration_minutes,
--                        sort_order, is_active, deleted_at),
--                        operations.ts:55 adds price,
--                        import.ts:219 inserts clinic_id, name, price,
--                        duration_minutes, description, is_active.
--   appointment_slots  → appointments.ts:61 (id, doctor_id, service_id,
--                        start_time, end_time, slot_status + clinic_id,
--                        deleted_at filters) and the booking RPC
--                        20260828013000_create_appointment_with_queue_link.sql
--                        which reads s.clinic_id, s.branch_id, s.doctor_id,
--                        s.service_id, s.start_time, s.slot_status and flips
--                        slot_status to 'booked' after a successful booking.
--
-- NEW TABLES: none. Every statement below is IF NOT EXISTS / idempotent so it
-- is safe to run against the live database; on a fresh database it provisions
-- the exact tables the API code expects. No columns are invented beyond the
-- ones the routes select/insert plus standard audit columns.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- doctors: clinic calendar staff. Filtered by the booking options endpoint as
-- deleted_at is null + is_active = true, ordered by name.
-- -----------------------------------------------------------------------------
create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  specialization text,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.doctors is 'أطباء العيادة، يُستخدمون كخيارات في حجز المواعيد (appointments.ts يرشّح deleted_at is null + is_active).';
comment on column public.doctors.specialization is 'التخصص كما يظهر في خيارات الحجز (doctors.specialization).';
comment on column public.doctors.deleted_at is 'حذف ناعم؛ السجلات المؤرشفة تختفي من خيارات الحجز.';

create index if not exists doctors_clinic_id_idx on public.doctors (clinic_id);
create index if not exists doctors_clinic_active_name_idx on public.doctors (clinic_id, is_active, name);

-- -----------------------------------------------------------------------------
-- services: bookable clinic services. Booking options select id, name,
-- duration_minutes ordered by sort_order; import.ts also writes price,
-- description, is_active.
-- -----------------------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  price numeric(12, 2) not null default 0 check (price >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.services is 'خدمات العيادة القابلة للحجز؛ خيارات الحجز ترتّبها حسب sort_order (appointments.ts).';
comment on column public.services.duration_minutes is 'مدة الخدمة بالدقائق، تُستخدم أيضًا كمدة افتراضية لتوليد المواعيد.';
comment on column public.services.sort_order is 'ترتيب العرض في خيارات الحجز.';
comment on column public.services.deleted_at is 'حذف ناعم؛ الخدمات المؤرشفة تختفي من خيارات الحجز.';

create index if not exists services_clinic_id_idx on public.services (clinic_id);
create index if not exists services_clinic_active_sort_idx on public.services (clinic_id, is_active, sort_order);

-- -----------------------------------------------------------------------------
-- appointment_slots: bookable time slots. The booking RPC requires
-- slot_status = 'available' at booking time and sets it to 'booked' after the
-- appointment is created.
-- -----------------------------------------------------------------------------
create table if not exists public.appointment_slots (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  slot_status text not null default 'available' check (slot_status in ('available', 'booked')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.appointment_slots is 'المواعيد المتاحة للحجز؛ booking RPC يشترط slot_status = available ويحوّلها إلى booked عند الحجز.';
comment on column public.appointment_slots.start_time is 'بداية الموعد (timestamptz) — خيارات الحجز ترشّح start_time >= now().';
comment on column public.appointment_slots.end_time is 'نهاية الموعد (timestamptz).';
comment on column public.appointment_slots.slot_status is 'available أو booked فقط، مطابق لما يكتبه create_appointment_with_queue_link.';
comment on column public.appointment_slots.deleted_at is 'حذف ناعم؛ المواعيد المؤرشفة تختفي من خيارات الحجز.';

create index if not exists appointment_slots_clinic_start_idx on public.appointment_slots (clinic_id, start_time);
create index if not exists appointment_slots_doctor_start_idx on public.appointment_slots (doctor_id, start_time);
create index if not exists appointment_slots_service_idx on public.appointment_slots (service_id);

-- -----------------------------------------------------------------------------
-- Row level security: per-tenant policies following the fn_has_clinic_permission
-- pattern used by 202608250831_create_voice_agent_call_logs.sql and
-- 202608250930_create_billing_tables.sql. Read access mirrors what the booking
-- flow needs (Appointments read or Settings read); writes require the same
-- Settings manage permission the clinic-setup CRUD endpoints enforce.
-- -----------------------------------------------------------------------------
alter table public.doctors enable row level security;
alter table public.services enable row level security;
alter table public.appointment_slots enable row level security;

grant select, insert, update, delete on table public.doctors to authenticated;
grant select, insert, update, delete on table public.services to authenticated;
grant select, insert, update, delete on table public.appointment_slots to authenticated;

drop policy if exists doctors_select on public.doctors;
create policy doctors_select
  on public.doctors
  for select
  to authenticated
  using (
    public.fn_has_clinic_permission(clinic_id, 'Settings', 'clinic_settings', 'read'::public.permission_action_enum)
    or public.fn_has_clinic_permission(clinic_id, 'Appointments', 'appointments', 'read'::public.permission_action_enum)
  );

drop policy if exists doctors_write on public.doctors;
create policy doctors_write
  on public.doctors
  for insert
  to authenticated
  with check (
    public.fn_has_clinic_permission(clinic_id, 'Settings', 'clinic_settings', 'manage'::public.permission_action_enum)
  );

drop policy if exists doctors_update on public.doctors;
create policy doctors_update
  on public.doctors
  for update
  to authenticated
  using (
    public.fn_has_clinic_permission(clinic_id, 'Settings', 'clinic_settings', 'manage'::public.permission_action_enum)
  )
  with check (
    public.fn_has_clinic_permission(clinic_id, 'Settings', 'clinic_settings', 'manage'::public.permission_action_enum)
  );

drop policy if exists doctors_delete on public.doctors;
create policy doctors_delete
  on public.doctors
  for delete
  to authenticated
  using (
    public.fn_has_clinic_permission(clinic_id, 'Settings', 'clinic_settings', 'manage'::public.permission_action_enum)
  );

drop policy if exists services_select on public.services;
create policy services_select
  on public.services
  for select
  to authenticated
  using (
    public.fn_has_clinic_permission(clinic_id, 'Settings', 'clinic_settings', 'read'::public.permission_action_enum)
    or public.fn_has_clinic_permission(clinic_id, 'Appointments', 'appointments', 'read'::public.permission_action_enum)
  );

drop policy if exists services_insert on public.services;
create policy services_insert
  on public.services
  for insert
  to authenticated
  with check (
    public.fn_has_clinic_permission(clinic_id, 'Settings', 'clinic_settings', 'manage'::public.permission_action_enum)
  );

drop policy if exists services_update on public.services;
create policy services_update
  on public.services
  for update
  to authenticated
  using (
    public.fn_has_clinic_permission(clinic_id, 'Settings', 'clinic_settings', 'manage'::public.permission_action_enum)
  )
  with check (
    public.fn_has_clinic_permission(clinic_id, 'Settings', 'clinic_settings', 'manage'::public.permission_action_enum)
  );

drop policy if exists services_delete on public.services;
create policy services_delete
  on public.services
  for delete
  to authenticated
  using (
    public.fn_has_clinic_permission(clinic_id, 'Settings', 'clinic_settings', 'manage'::public.permission_action_enum)
  );

drop policy if exists appointment_slots_select on public.appointment_slots;
create policy appointment_slots_select
  on public.appointment_slots
  for select
  to authenticated
  using (
    public.fn_has_clinic_permission(clinic_id, 'Settings', 'clinic_settings', 'read'::public.permission_action_enum)
    or public.fn_has_clinic_permission(clinic_id, 'Appointments', 'appointments', 'read'::public.permission_action_enum)
  );

drop policy if exists appointment_slots_insert on public.appointment_slots;
create policy appointment_slots_insert
  on public.appointment_slots
  for insert
  to authenticated
  with check (
    public.fn_has_clinic_permission(clinic_id, 'Settings', 'clinic_settings', 'manage'::public.permission_action_enum)
  );

drop policy if exists appointment_slots_update on public.appointment_slots;
create policy appointment_slots_update
  on public.appointment_slots
  for update
  to authenticated
  using (
    public.fn_has_clinic_permission(clinic_id, 'Settings', 'clinic_settings', 'manage'::public.permission_action_enum)
  )
  with check (
    public.fn_has_clinic_permission(clinic_id, 'Settings', 'clinic_settings', 'manage'::public.permission_action_enum)
  );

drop policy if exists appointment_slots_delete on public.appointment_slots;
create policy appointment_slots_delete
  on public.appointment_slots
  for delete
  to authenticated
  using (
    public.fn_has_clinic_permission(clinic_id, 'Settings', 'clinic_settings', 'manage'::public.permission_action_enum)
  );
