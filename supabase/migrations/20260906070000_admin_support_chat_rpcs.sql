-- ============================================================
-- Warungpedia migration — Admin support chat RPCs
-- ============================================================

-- RPC: admin_get_support_conversations()
-- Returns all support conversations with latest message & unread count (admin only).
create or replace function public.admin_get_support_conversations()
returns table (
  id uuid,
  user_id uuid,
  user_name text,
  user_email text,
  user_avatar_url text,
  last_message text,
  last_message_at timestamptz,
  unread_count bigint,
  created_at timestamptz
)
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin only' using errcode = '42501';
  end if;

  return query
    select
      sc.id,
      sc.user_id,
      coalesce(p.full_name, u.email) as user_name,
      u.email,
      p.avatar_url,
      (
        select sm.body
        from public.support_messages sm
        where sm.conversation_id = sc.id
        order by sm.created_at desc
        limit 1
      ) as last_message,
      (
        select sm.created_at
        from public.support_messages sm
        where sm.conversation_id = sc.id
        order by sm.created_at desc
        limit 1
      ) as last_message_at,
      (
        select count(*)
        from public.support_messages sm
        where sm.conversation_id = sc.id
          and sm.sender_id <> sc.user_id
          and sm.is_read = false
      ) as unread_count,
      sc.created_at
    from public.support_conversations sc
    join auth.users u on u.id = sc.user_id
    left join public.profiles p on p.id = sc.user_id
    order by sc.updated_at desc
    limit 200;
end;
$$;

-- RPC: admin_get_support_messages(conversation_id uuid)
-- Returns all messages for a conversation (admin only).
create or replace function public.admin_get_support_messages(p_conversation_id uuid)
returns table (
  id uuid,
  sender_id uuid,
  sender_name text,
  sender_email text,
  body text,
  is_read boolean,
  created_at timestamptz
)
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin only' using errcode = '42501';
  end if;

  return query
    select
      sm.id,
      sm.sender_id,
      coalesce(p.full_name, u.email) as sender_name,
      u.email,
      sm.body,
      sm.is_read,
      sm.created_at
    from public.support_messages sm
    join auth.users u on u.id = sm.sender_id
    left join public.profiles p on p.id = sm.sender_id
    where sm.conversation_id = p_conversation_id
    order by sm.created_at asc
    limit 100;
end;
$$;

-- RPC: admin_send_support_message(conversation_id uuid, body text)
-- Sends a message from admin to user (admin only).
create or replace function public.admin_send_support_message(p_conversation_id uuid, p_body text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_msg_id uuid;
  v_body text;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required' using errcode = '42501';
  end if;

  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin only' using errcode = '42501';
  end if;

  v_body := nullif(trim(p_body), '');
  if v_body is null then
    raise exception 'Message is empty' using errcode = '23514';
  end if;

  insert into public.support_messages (conversation_id, sender_id, body)
  values (p_conversation_id, v_caller, left(v_body, 2000))
  returning id into v_msg_id;

  update public.support_conversations set updated_at = now() where id = p_conversation_id;

  -- Notify user
  perform public.notify_user(
    (select user_id from public.support_conversations where id = p_conversation_id),
    'CHAT',
    'Balasan Admin',
    left(v_body, 600),
    '/chat'
  );

  return v_msg_id;
end;
$$;

-- RPC: admin_mark_conversation_read(conversation_id uuid)
-- Marks all messages in a conversation as read (admin only).
create or replace function public.admin_mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin only' using errcode = '42501';
  end if;

  update public.support_messages
  set is_read = true, read_at = now()
  where conversation_id = p_conversation_id;
end;
$$;

-- Grant execute permissions
grant execute on function public.admin_get_support_conversations() to authenticated;
grant execute on function public.admin_get_support_messages(uuid) to authenticated;
grant execute on function public.admin_send_support_message(uuid, text) to authenticated;
grant execute on function public.admin_mark_conversation_read(uuid) to authenticated;
