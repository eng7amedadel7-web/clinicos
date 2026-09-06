-- New auth users must have a matching public.users row: the onboarding
-- audit trail (audit_logs.user_id -> users.id) requires it, so clinic
-- registration was failing with 23503 for every new signup. This restores the
-- standard auth.users -> public.users sync trigger plus a backfill for users
-- created while the trigger was missing.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $$
begin
  insert into public.users (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), ''),
      split_part(coalesce(new.email, 'user'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill auth users that were created while the sync was missing.
insert into public.users (id, full_name)
select
  u.id,
  coalesce(
    nullif(btrim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')), ''),
    split_part(coalesce(u.email, 'user'), '@', 1)
  )
from auth.users u
where not exists (select 1 from public.users pu where pu.id = u.id)
on conflict (id) do nothing;
