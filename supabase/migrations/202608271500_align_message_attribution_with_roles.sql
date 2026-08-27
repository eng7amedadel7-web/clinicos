-- Align message attribution with the SaaS permission model.
-- The old trigger required every sender to have a clinic_staff row,
-- while the application authorizes clinic users through user_roles.
-- Keep the clinic_staff path for existing integrations, and allow the
-- authenticated role-based Inbox sender only when the sender is the caller
-- and the caller has the scoped Inbox handoff permission.

create or replace function public.enforce_inbox_attribution_scope()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $$
begin
  if tg_table_name = 'conversations' then
    if new.branch_id is not null then
      if not exists (
        select 1
        from public.branches as branch
        where branch.id = new.branch_id
          and branch.clinic_id = new.clinic_id
          and branch.deleted_at is null
      ) then
        raise exception 'conversation branch must belong to its clinic'
          using errcode = 'foreign_key_violation';
      end if;
    end if;
  elsif tg_table_name = 'messages' then
    if new.sent_by_staff_id is not null then
      if auth.uid() is not null and new.sent_by_staff_id <> auth.uid() then
        raise exception 'message sender must match authenticated user'
          using errcode = 'foreign_key_violation';
      end if;

      if not exists (
        select 1
        from public.clinic_staff as staff
        where staff.clinic_id = new.clinic_id
          and staff.user_id = new.sent_by_staff_id
      )
      and not (
        auth.uid() is not null
        and new.sent_by_staff_id = auth.uid()
        and public.fn_has_clinic_permission(
          new.clinic_id,
          'inbox',
          'conversations',
          'handoff'::public.permission_action_enum,
          null::uuid
        )
      ) then
        raise exception 'message sender must belong to its clinic'
          using errcode = 'foreign_key_violation';
      end if;
    end if;
  end if;
  return new;
end;
$$;
