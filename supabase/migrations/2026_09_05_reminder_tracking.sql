-- =============================================================================
-- Appointment reminder tracking — additive, idempotent schema for the cron
-- reminder job (api-server /api/cron/reminders, see artifacts/api-server/src/routes/cron.ts).
--
-- The cron endpoint needs a "was a reminder already sent?" flag without any
-- schema redesign, so we add one nullable timestamp on public.appointments.
-- Every statement is IF NOT EXISTS / idempotent: on the live database it only
-- adds what is missing, and on a fresh database it provisions the same shape.
-- No SQL here is executed by the app; it must be applied to Supabase before
-- the reminders cron goes live (the endpoint answers 502 with an Arabic error
-- until the column exists).
--
-- Vercel cron DST caveat (documented here because vercel.json is plain JSON
-- and cannot carry comments): the reminders schedule in vercel.json is
-- "0 6 * * *" (06:00 UTC). Cairo (Africa/Cairo) reinstated DST, so that is
-- 09:00 local while DST is active (UTC+3, ~April–October) and 08:00 local in
-- winter (UTC+2). Switching year-round to 07:00 UTC would instead give 09:00
-- in winter and 10:00 in summer. The job itself formats dates/times with the
-- clinic timezone, so only the send moment shifts — never the rendered time.
-- =============================================================================

alter table public.appointments
  add column if not exists reminder_sent_at timestamptz;

comment on column public.appointments.reminder_sent_at is
  'وقت إرسال تذكير الواتساب لهذا الموعد بواسطة مهمة الـcron (/api/cron/reminders)؛ NULL يعني لم يُرسل تذكير بعد. تُدار بواسطة الخدمة فقط (service-role) ولا يكتبها المستخدمون.';

-- Partial index matching the cron query: upcoming, not-yet-reminded,
-- still-active appointments. Idempotent and additive.
create index if not exists appointments_reminder_window_idx
  on public.appointments (scheduled_at)
  where reminder_sent_at is null
    and deleted_at is null
    and appointment_status in ('pending', 'scheduled', 'confirmed');
