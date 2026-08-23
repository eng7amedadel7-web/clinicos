-- Root cause fix: PostgreSQL grants EXECUTE on newly-created functions to PUBLIC
-- unless explicitly revoked. That made every SECURITY DEFINER RPC callable by
-- anon/authenticated through PostgREST, regardless of whether the body checked
-- tenant access. Replace the implicit public surface with an explicit allowlist.

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;

-- The web application intentionally exposes only these two RPC contracts today.
-- app_onboard_clinic performs auth.uid()/founder validation internally.
-- review_record_response is the public tokenized feedback contract and remains
-- public until its token contract is migrated behind a dedicated endpoint.
grant execute on function public.app_onboard_clinic(
  text, text, text, text, text, text, jsonb, text, text, text, uuid
) to authenticated;
grant execute on function public.review_record_response(
  uuid, smallint, text, text, timestamptz
) to anon;

-- Prevent the same exposure from returning when future functions are created by
-- the migration owner in the exposed API schema.
alter default privileges in schema public
  revoke execute on functions from public;
alter default privileges in schema public
  revoke execute on functions from anon;
alter default privileges in schema public
  revoke execute on functions from authenticated;
alter default privileges in schema public
  grant execute on functions to service_role;

-- Keep the private schema used by onboarding inaccessible through PostgREST.
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
