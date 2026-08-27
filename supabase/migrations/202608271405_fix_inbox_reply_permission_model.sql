-- Align the inbox reply RPC with the SaaS permission model.
-- The API gate and fn_get_user_clinic_ids use user_roles, while the old
-- function additionally required a clinic_staff row. That rejected valid
-- clinic users whose role grants inbox handoff permission.

create or replace function public.fn_send_inbox_reply(p_conversation_id uuid, p_content text)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
declare
  v_conversation record;
  v_message_id uuid;
  v_user_id uuid;
  v_now timestamptz := now();
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select id, clinic_id, patient_id, channel_id, status, ai_status
    into v_conversation
  from public.conversations
  where id = p_conversation_id
    and deleted_at is null;

  if not found then
    raise exception 'Conversation not found';
  end if;

  -- The same server-side permission contract used by the API route.
  -- This derives tenant scope from auth.uid() and never trusts the browser.
  if not public.fn_has_clinic_permission(
    v_conversation.clinic_id,
    'inbox',
    'conversations',
    'handoff'::public.permission_action_enum,
    null::uuid
  ) then
    raise exception 'No permission for this clinic';
  end if;

  insert into public.messages (
    conversation_id,
    clinic_id,
    patient_id,
    direction,
    sender_type,
    content,
    message_status,
    received_at,
    sent_by_staff_id,
    metadata
  )
  values (
    p_conversation_id,
    v_conversation.clinic_id,
    v_conversation.patient_id,
    'outgoing',
    'clinic',
    p_content,
    'sent',
    v_now,
    v_user_id,
    jsonb_build_object('sent_by', 'reception_inbox', 'sent_by_user_id', v_user_id)
  )
  returning id into v_message_id;

  update public.conversations
  set last_ai_response = null,
      last_activity_at = v_now,
      updated_at = v_now,
      status = 'active',
      is_handoff = false
  where id = p_conversation_id;

  return jsonb_build_object(
    'message_id', v_message_id,
    'conversation_id', p_conversation_id,
    'sent_by_staff_id', v_user_id
  );
end;
$$;
