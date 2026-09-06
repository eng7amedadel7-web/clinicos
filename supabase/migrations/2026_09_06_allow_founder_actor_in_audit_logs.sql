-- The private onboarding implementation records the clinic founder in
-- audit_logs with actor_type = 'founder' (action founder.create_clinic), but
-- the check constraint only allowed user/system/workflow/ai/api — so every
-- new clinic registration failed with 23514 and no clinic was provisioned.
-- Widen the actor taxonomy to include the founder actor.
alter table public.audit_logs drop constraint audit_logs_actor_type_check;

alter table public.audit_logs add constraint audit_logs_actor_type_check
  check (actor_type = any (array['user'::text, 'system'::text, 'workflow'::text, 'ai'::text, 'api'::text, 'founder'::text]));
