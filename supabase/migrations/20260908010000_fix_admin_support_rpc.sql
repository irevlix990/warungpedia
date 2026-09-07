-- ============================================================
-- Fix admin support RPCs: cast varchar→text to avoid 42804
-- ============================================================

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
      coalesce(p.full_name, u.email::text) as user_name,
      u.email::text as user_email,
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
        select count(*)::bigint
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

-- Fix admin_get_support_messages: cast varchar→text
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
      coalesce(p.full_name, u.email::text) as sender_name,
      u.email::text as sender_email,
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