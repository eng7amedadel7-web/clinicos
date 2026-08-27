-- Align Inbox manual replies with the canonical permission catalog.
-- Message creation and AI/human handoff are separate capabilities:
--   inbox/messages/create
--   inbox/handoffs/handoff
-- Tenant scope is always derived from auth.uid() and the conversation row.

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

  if p_conversation_id is null or p_content is null or btrim(p_content) = '' then
    raise exception 'Message content is required';
  end if;

  select id, clinic_id, patient_id, channel_id, status, ai_status
    into v_conversation
  from public.conversations
  where id = p_conversation_id
    and deleted_at is null;

  if not found then
    raise exception 'Conversation not found';
  end if;

  -- Sending a message requires message-create permission, not handoff permission.
  -- The clinic is taken from the conversation and the caller from auth.uid().
  if not public.fn_has_clinic_permission(
    v_conversation.clinic_id,
    'inbox',
    'messages',
    'create'::public.permission_action_enum,
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
    btrim(p_content),
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

create or replace function public.enforce_inbox_attribution_scope()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $$
begin
  if tg_table_name = 'conversations' then
    if new.branch_id is not null then
      if not exists (
        select 1
        from public.branches as branch
        where branch.id = new.branch_id
          and branch.clinic_id = new.clinic_id
          and branch.deleted_at is null
      ) then
        raise exception 'conversation branch must belong to its clinic'
          using errcode = 'foreign_key_violation';
      end if;
    end if;
  elsif tg_table_name = 'messages' then
    if new.sent_by_staff_id is not null then
      if auth.uid() is not null and new.sent_by_staff_id <> auth.uid() then
        raise exception 'message sender must match authenticated user'
          using errcode = 'foreign_key_violation';
      end if;

      if not exists (
        select 1
        from public.clinic_staff as staff
        where staff.clinic_id = new.clinic_id
          and staff.user_id = new.sent_by_staff_id
      )
      and not (
        auth.uid() is not null
        and new.sent_by_staff_id = auth.uid()
        and public.fn_has_clinic_permission(
          new.clinic_id,
          'inbox',
          'messages',
          'create'::public.permission_action_enum,
          null::uuid
        )
      ) then
        raise exception 'message sender must belong to its clinic'
          using errcode = 'foreign_key_violation';
      end if;
    end if;
  end if;
  return new;
end;
$$;
