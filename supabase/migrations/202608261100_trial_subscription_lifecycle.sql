-- Trial lifecycle: every clinic starts on a 10-day Pro trial recorded in
-- clinic_subscriptions, and Paddle rows take over once a real subscription exists.

-- Trial rows have no Paddle subscription yet.
alter table public.clinic_subscriptions alter column paddle_subscription_id drop not null;

create or replace function public.fn_create_trial_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.clinic_subscriptions (clinic_id, paddle_subscription_id, plan, billing_interval, status, trial_ends_at)
  values (new.id, null, 'pro', 'month', 'trialing', now() + interval '10 days')
  on conflict (clinic_id) do nothing;
  return new;
end;
$$;

-- Trigger functions invoked by their trigger do not check EXECUTE privileges,
-- so revoking keeps clients from calling it directly while the trigger still fires.
revoke execute on function public.fn_create_trial_subscription() from public, anon, authenticated;

drop trigger if exists trg_clinic_trial_subscription on public.clinics;
create trigger trg_clinic_trial_subscription
  after insert on public.clinics
  for each row execute function public.fn_create_trial_subscription();

-- Backfill clinics registered before this lifecycle existed; their trial window
-- is anchored to the clinic creation date so long-standing clinics read as expired.
insert into public.clinic_subscriptions (clinic_id, paddle_subscription_id, plan, billing_interval, status, trial_ends_at)
select c.id, null, 'pro', 'month', 'trialing', c.created_at + interval '10 days'
from public.clinics c
where c.deleted_at is null
on conflict (clinic_id) do nothing;
