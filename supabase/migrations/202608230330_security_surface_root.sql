-- Move extensions out of the exposed public schema. Existing object OIDs and
-- dependent columns/indexes remain intact while the extension namespace becomes
-- non-public, matching Supabase's recommended layout.
alter extension btree_gist set schema extensions;
-- pg_net is non-relocatable on Supabase and must remain in public; its `net`
-- objects are protected by role grants rather than schema relocation.
alter extension pg_trgm set schema extensions;
alter extension vector set schema extensions;

-- review_record_response previously accepted only a UUID and rating. There was
-- no token, auth.uid() check, or expiry check, so anonymous callers could submit
-- a response for any review_request_id. Disable the unsafe public contract at
-- the database boundary. A future public review flow must introduce a signed
-- one-time token and a separate reviewed endpoint before granting anon access.
revoke all on function public.review_record_response(
  uuid, smallint, text, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.review_record_response(
  uuid, smallint, text, text, timestamptz
) to service_role;

-- Ensure future functions created in the exposed schema do not regain implicit
-- EXECUTE for browser roles.
alter default privileges in schema public
  revoke execute on functions from public;
alter default privileges in schema public
  revoke execute on functions from anon;
alter default privileges in schema public
  revoke execute on functions from authenticated;
alter default privileges in schema public
  grant execute on functions to service_role;
