-- Fix the no-show recovery completion function assigning a scalar timestamp
-- into an appointments rowtype (which attempted to cast it into the UUID id).
CREATE OR REPLACE FUNCTION public.complete_no_show_recovery_attempt(
  p_attempt_id uuid,
  p_status text,
  p_response_type text DEFAULT NULL::text,
  p_failure_code text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  a public.no_show_recovery_attempts%ROWTYPE;
  c public.no_show_cases%ROWTYPE;
  v_scheduled_at timestamptz;
  v_closure_event_key text;
  v_domain_event_id uuid;
  v_notification_event_id uuid;
  v_final_no_response boolean;
BEGIN
  SELECT * INTO a
  FROM public.no_show_recovery_attempts
  WHERE id = p_attempt_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'ATTEMPT_NOT_FOUND');
  END IF;

  SELECT * INTO c
  FROM public.no_show_cases
  WHERE id = a.case_id
  FOR UPDATE;

  IF p_status NOT IN ('RESPONDED', 'NO_RESPONSE', 'FAILED', 'COMPLETED', 'CANCELLED') THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_ATTEMPT_STATUS');
  END IF;

  v_final_no_response := p_status = 'NO_RESPONSE' AND a.attempt_number >= c.max_attempts;

  UPDATE public.no_show_recovery_attempts
  SET status = p_status,
      response_type = p_response_type,
      failure_code = p_failure_code,
      completed_at = CASE
        WHEN p_status IN ('RESPONDED', 'NO_RESPONSE', 'FAILED', 'COMPLETED', 'CANCELLED')
          THEN now()
        ELSE completed_at
      END,
      updated_at = now()
  WHERE id = a.id;

  UPDATE public.no_show_cases
  SET last_activity_at = now(),
      case_status = CASE
        WHEN p_response_type = 'HUMAN_REQUEST' THEN 'HANDOFF_ACTIVE'
        WHEN v_final_no_response OR (p_status = 'FAILED' AND a.attempt_number >= c.max_attempts) THEN 'CLOSED'
        ELSE case_status
      END,
      recovery_outcome = CASE
        WHEN p_response_type = 'HUMAN_REQUEST' THEN 'HUMAN_HANDOFF'
        WHEN v_final_no_response THEN 'NO_RESPONSE'
        WHEN p_status = 'FAILED' AND a.attempt_number >= c.max_attempts THEN 'REBOOKING_FAILED'
        ELSE recovery_outcome
      END,
      closed_at = CASE
        WHEN v_final_no_response OR (p_status = 'FAILED' AND a.attempt_number >= c.max_attempts)
          THEN now()
        ELSE closed_at
      END
  WHERE id = c.id;

  IF v_final_no_response THEN
    SELECT ap.scheduled_at INTO v_scheduled_at
    FROM public.appointments ap
    WHERE ap.id = c.appointment_id
      AND ap.clinic_id = c.clinic_id
    LIMIT 1;

    v_closure_event_key := 'no_show.recovery.closed:' || a.id::text;

    INSERT INTO public.domain_events (
      clinic_id,
      branch_id,
      event_type,
      schema_version,
      entity_type,
      entity_id,
      actor_type,
      correlation_id,
      idempotency_key,
      metadata,
      occurred_at
    )
    VALUES (
      c.clinic_id,
      c.branch_id,
      'no_show.recovery_requested',
      1,
      'no_show_recovery_attempt',
      a.id,
      'system',
      c.correlation_id,
      v_closure_event_key,
      jsonb_build_object(
        'case_id', c.id,
        'attempt_id', a.id,
        'appointment_id', c.appointment_id,
        'patient_id', c.patient_id,
        'outcome', 'NO_RESPONSE'
      ),
      now()
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_domain_event_id;

    INSERT INTO public.notification_domain_events (
      clinic_id,
      appointment_id,
      event_type,
      event_key,
      aggregate_version,
      current_scheduled_at,
      occurred_at,
      correlation_id,
      actor_type
    )
    VALUES (
      c.clinic_id,
      c.appointment_id,
      'no_show.recovery_requested',
      v_closure_event_key,
      'no_show_recovery_attempt:' || a.attempt_number::text,
      v_scheduled_at,
      now(),
      c.correlation_id,
      'no_show_bridge'
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_notification_event_id;

    IF v_notification_event_id IS NULL THEN
      SELECT id INTO v_notification_event_id
      FROM public.notification_domain_events
      WHERE event_key = v_closure_event_key
      LIMIT 1;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'ATTEMPT_COMPLETED',
    'attempt_id', a.id,
    'case_id', c.id,
    'status', p_status,
    'response_type', p_response_type,
    'closure_notification_domain_event_id', v_notification_event_id
  );
END;
$$;
