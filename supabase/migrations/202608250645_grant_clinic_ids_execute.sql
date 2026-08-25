-- RLS helper used by tenant-scoped table policies.
-- Keep this executable by signed-in users only; never expose it to anon.
grant execute on function public.fn_get_user_clinic_ids() to authenticated;
revoke execute on function public.fn_get_user_clinic_ids() from anon;
