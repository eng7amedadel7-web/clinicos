-- Allow authenticated clinic users to call the tenant-scoped permission gate.
grant execute on function public.fn_has_clinic_permission(uuid, text, text, public.permission_action_enum, uuid) to authenticated;
revoke execute on function public.fn_has_clinic_permission(uuid, text, text, public.permission_action_enum, uuid) from anon;
