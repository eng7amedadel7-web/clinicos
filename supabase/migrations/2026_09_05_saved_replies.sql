-- Saved replies (القوالب الجاهزة) backing table for /api/templates routes.
-- Idempotent: safe to re-run.

create table if not exists public.saved_replies (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  title text not null,
  content text not null,
  category text default 'general',
  shortcut text,
  usage_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

alter table public.saved_replies enable row level security;

-- Read: any authenticated user whose clinic (per fn_get_user_clinic_ids) owns the row.
do $body$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'saved_replies' and policyname = 'saved_replies_select'
  ) then
    create policy saved_replies_select on public.saved_replies
      for select to authenticated
      using (exists (select 1 from fn_get_user_clinic_ids() c where c = saved_replies.clinic_id));
  end if;

  -- Writes are allowed only on rows owned by the caller's clinic; anything
  -- else is denied by default (no matching policy).
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'saved_replies' and policyname = 'saved_replies_insert'
  ) then
    create policy saved_replies_insert on public.saved_replies
      for insert to authenticated
      with check (exists (select 1 from fn_get_user_clinic_ids() c where c = saved_replies.clinic_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'saved_replies' and policyname = 'saved_replies_update'
  ) then
    create policy saved_replies_update on public.saved_replies
      for update to authenticated
      using (exists (select 1 from fn_get_user_clinic_ids() c where c = saved_replies.clinic_id))
      with check (exists (select 1 from fn_get_user_clinic_ids() c where c = saved_replies.clinic_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'saved_replies' and policyname = 'saved_replies_delete'
  ) then
    create policy saved_replies_delete on public.saved_replies
      for delete to authenticated
      using (exists (select 1 from fn_get_user_clinic_ids() c where c = saved_replies.clinic_id));
  end if;
end
$body$;

create index if not exists saved_replies_clinic_id_idx on public.saved_replies (clinic_id);
