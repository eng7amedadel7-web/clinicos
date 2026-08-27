-- Expose the authenticated Inbox reply RPC after the public-function lockdown.
-- The function remains SECURITY DEFINER and performs its own auth and tenant checks.
revoke all on function public.fn_send_inbox_reply(uuid, text) from public, anon;
grant execute on function public.fn_send_inbox_reply(uuid, text) to authenticated;
