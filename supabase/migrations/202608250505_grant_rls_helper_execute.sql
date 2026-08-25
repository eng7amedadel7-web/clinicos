-- RLS policies call these SECURITY DEFINER helpers while evaluating authenticated requests.
-- Grant only the required EXECUTE privilege to the authenticated role; do not expose
-- the helpers to anon or change any table policy.
grant execute on function public.fn_is_user_clinic_member(uuid) to authenticated;
grant execute on function public.fn_is_clinic_operator(uuid) to authenticated;
