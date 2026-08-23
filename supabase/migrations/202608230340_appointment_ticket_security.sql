-- appointment_ticket_counters is an internal sequence table used only by the
-- appointment trigger. Make the deny boundary explicit for browser roles.
create policy deny_external_access_appointment_ticket_counters
  on public.appointment_ticket_counters
  for all to anon, authenticated
  using (false)
  with check (false);

-- assign_appointment_ticket_id is a trigger function, not a PostgREST API.
-- resolve_appointment_by_ticket accepted arbitrary clinic_id and patient_id
-- values without proving the caller owned them. Until a signed patient lookup
-- contract exists, both functions are backend/trigger-only.
revoke all on function public.assign_appointment_ticket_id() from public, anon, authenticated;
revoke all on function public.resolve_appointment_by_ticket(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.assign_appointment_ticket_id() to service_role;
grant execute on function public.resolve_appointment_by_ticket(uuid, uuid, text) to service_role;
