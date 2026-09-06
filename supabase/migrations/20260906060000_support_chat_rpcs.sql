-- ============================================================
-- Warungpedia migration — Support chat RPCs (user → admin)
-- ============================================================

-- Ensure the extension exists (idempotent)
create extension if not exists pgcrypto;

-- RPC: get_or_create_support_conversation()
create or replace function public.get_or_create_support_conversation()
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_conv_id uuid;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required' using errcode = '42501';
  end if;

  select id into v_conv_id from public.support_conversations where user_id = v_caller;

  if v_conv_id is null then
    insert into public.support_conversations (user_id)
    values (v_caller)
    returning id into v_conv_id;
  end if;

  return v_conv_id;
end;
$$;

-- RPC: send_support_message(p_body text)
create or replace function public.send_support_message(p_body text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_conv_id uuid;
  v_msg_id uuid;
  v_body text;
  v_sender_name text;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required' using errcode = '42501';
  end if;

  v_body := nullif(trim(p_body), '');
  if v_body is null then
    raise exception 'Message is empty' using errcode = '23514';
  end if;

  -- Get or create conversation
  v_conv_id := public.get_or_create_support_conversation();

  -- Insert message
  insert into public.support_messages (conversation_id, sender_id, body)
  values (v_conv_id, v_caller, left(v_body, 2000))
  returning id into v_msg_id;

  -- Update conversation timestamp
  update public.support_conversations set updated_at = now() where id = v_conv_id;

  -- Note: Admins will see new messages via Realtime subscription in admin dashboard
  -- No in-app notification needed for user->admin messages

  return v_msg_id;
end;
$$;

-- RPC: mark_support_conversation_read(p_conversation_id uuid default null)
create or replace function public.mark_support_conversation_read(p_conversation_id uuid default null)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_conv_id uuid := p_conversation_id;
begin
  if v_caller is null then
    return;
  end if;

  if v_conv_id is null then
    select id into v_conv_id from public.support_conversations where user_id = v_caller;
  end if;

  if v_conv_id is not null then
    update public.support_messages
    set is_read = true, read_at = now()
    where conversation_id = v_conv_id
      and sender_id <> v_caller
      and is_read = false;
  end if;
end;
$$;

-- Grant execute permissions to authenticated users
grant execute on function public.get_or_create_support_conversation() to authenticated;
grant execute on function public.send_support_message(text) to authenticated;
grant execute on function public.mark_support_conversation_read(uuid) to authenticated;
