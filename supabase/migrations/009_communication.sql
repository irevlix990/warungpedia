-- ============================================================
-- Warungpedia migration 009 — Communication & notifications
-- ============================================================
-- Adds in-app notifications, per-user notification preferences, and
-- buyer–seller order-scoped chat. Notification delivery is driven from the
-- database: definer functions and triggers create `notifications` rows, an
-- optional pg_net webhook fans emails out to an Edge Function, and RLS keeps
-- every row scoped to its owner / participants / admins.
--
-- Preferences are stored on `profiles.notification_prefs` as JSONB. The shape
-- is `{ email: bool, push: bool, types: { <type>: bool } }`. `notify_user`
-- honors these before writing a row / firing an email.

create extension if not exists pg_net;
create extension if not exists pgcrypto;

-- Notification types are a small dictionary the app references by `code`.
create table if not exists public.notification_types (
  id   uuid primary key default gen_random_uuid(),
  code text not null unique,     -- e.g. ORDER_UPDATE, RETURN_UPDATE, CHAT, DISPUTE
  label text not null
);

-- A single per-user notification (in-app; optionally emailed).
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null references public.notification_types (code),
  title      text not null,
  body       text not null default '',
  link       text,                              -- routed app URL
  is_read    boolean not null default false,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index notifications_user_read_idx
  on public.notifications (user_id, is_read);

-- Buyer–seller conversation scoped to an order. Multi-vendor orders may have
-- one conversation per seller, so (order_id, seller_id) is unique.
create table if not exists public.conversations (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  buyer_id       uuid not null references public.profiles (id) on delete cascade,
  seller_id      uuid not null references public.profiles (id),
  last_message_at timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (order_id, seller_id)
);

create index conversations_order_idx on public.conversations (order_id);
create index conversations_seller_idx on public.conversations (seller_id);
create index conversations_buyer_idx on public.conversations (buyer_id);

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- A single chat message within a conversation.
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id),
  body            text not null,
  is_read         boolean not null default false,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at asc);
create index messages_conversation_unread_idx
  on public.messages (conversation_id) where is_read = false;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.notification_types enable row level security;
alter table public.notifications enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Notification types are universally readable; only admins maintain them.
create policy "notification_types_select"
  on public.notification_types for select using (true);
create policy "notification_types_admin_write"
  on public.notification_types for all using (
    public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Users read their own notifications; admins may read all (for diagnostics).
create policy "notifications_select_own"
  on public.notifications for select using (
    user_id = auth.uid() or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );
-- No client writes: rows are created only by the notify_user definer.

-- Conversations are scoped to the buyer, the seller, and admins.
create policy "conversations_select"
  on public.conversations for select using (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Messages are scoped to the participants of the owning conversation.
create policy "messages_select"
  on public.messages for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- ============================================================
-- NOTIFICATION CREATION (security definer)
-- ============================================================

-- Reads the reserved-from-user preference for a notification type + channel.
-- Returns true when the user has not disabled it.
create or replace function public.notify_allowed(
  p_user_id uuid,
  p_type    text,
  p_channel text default 'push'
)
returns boolean
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_prefs jsonb;
  v_type_enabled boolean;
begin
  select notification_prefs into v_prefs
  from public.profiles where id = p_user_id;

  if v_prefs is null then
    return true;  -- default: everything on
  end if;

  if v_prefs ? 'types' then
    v_type_enabled := (v_prefs -> 'types' -> p_type)::text <> 'false';
    if not v_type_enabled then
      return false;
    end if;
  end if;

  if v_prefs ? p_channel and (v_prefs ->> p_channel) = 'false' then
    return false;
  end if;

  return true;
end;
$$;

-- Queues an email for the just-created notification via pg_net when email is
-- globally enabled (settings `notifications.email_enabled`) and the recipient
-- has not disabled email for the type. Best-effort: never raises.
create or replace function public.maybe_send_email_notification(
  p_notification_id uuid
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_enabled boolean;
  v_url     text;
  v_email   text;
  v_n       public.notifications%rowtype;
begin
  select (value->>'enabled')::boolean into v_enabled
  from public.settings where key = 'notifications.email_enabled';
  if not coalesce(v_enabled, false) then
    return;
  end if;

  select value into v_url from public.settings where key = 'notifications.email_url';
  if v_url is null or v_url = '' then
    return;
  end if;

  select * into v_n from public.notifications where id = p_notification_id;
  if v_n is null or not public.notify_allowed(v_n.user_id, v_n.type, 'email') then
    return;
  end if;

  select u.email into v_email from auth.users u where u.id = v_n.user_id;
  if v_email is null then
    return;
  end if;

  begin
    perform net.http_post(
      url     := v_url,
      headers := '{"content-type":"application/json"}'::jsonb,
      body    := jsonb_build_object(
        'to',        v_email,
        'title',     v_n.title,
        'body',      v_n.body,
        'link',      v_n.link
      )
    );
  exception when others then
    null;  -- email delivery must never break the notification write
  end;
end;
$$;

-- Core function: creates an in-app notification honoring preferences, then
-- opportunistically queues an email. Returns the new notification id.
create or replace function public.notify_user(
  p_user_id uuid,
  p_type    text,
  p_title   text,
  p_body    text default '',
  p_link    text default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if public.notify_allowed(p_user_id, p_type, 'push') then
    insert into public.notifications (user_id, type, title, body, link)
    values (p_user_id, p_type, p_title, coalesce(p_body,''), p_link)
    returning id into v_id;

    perform public.maybe_send_email_notification(v_id);
  end if;
  return v_id;
end;
$$;

-- The acting user marks one of their notifications as read.
create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.notifications
  set is_read = true, read_at = now()
  where id = p_notification_id and user_id = auth.uid();
  if not found then
    raise exception 'Notification not found' using errcode = 'P0002';
  end if;
end;
$$;

-- The acting user marks all of their notifications as read.
create or replace function public.mark_all_notifications_read()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.notifications
  set is_read = true, read_at = now()
  where user_id = auth.uid() and is_read = false;
end;
$$;

-- ============================================================
-- CONVERSATION & MESSAGING (security definer)
-- ============================================================

-- Returns true when the acting user is the buyer or the order's seller.
create or replace function public.conversation_participant(
  p_order_id uuid
)
returns boolean
language plpgsql
stable
as $$
begin
  if exists (select 1 from public.orders where id = p_order_id and user_id = auth.uid()) then
    return true;
  end if;
  if exists (
    select 1 from public.order_items oi
    join public.stores s on s.id = oi.store_id
    where oi.order_id = p_order_id and s.owner_id = auth.uid()
  ) then
    return true;
  end if;
  return false;
end;
$$;

-- Resolves the counterparty for a participant: the buyer for a seller, and the
-- single owner-seller for the buyer. Throws for non-participants.
create or replace function public.conversation_counterpart(
  p_order_id uuid
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_buyer  uuid;
  v_seller uuid;
begin
  select user_id into v_buyer from public.orders where id = p_order_id;
  if v_buyer is null then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  if v_caller = v_buyer then
    select s.owner_id into v_seller
    from public.order_items oi
    join public.stores s on s.id = oi.store_id
    where oi.order_id = p_order_id
    limit 1;
    if v_seller is null then
      raise exception 'No seller for this order' using errcode = 'P0002';
    end if;
    return v_seller;
  end if;

  select s.owner_id into v_seller
  from public.order_items oi
  join public.stores s on s.id = oi.store_id
  where oi.order_id = p_order_id and s.owner_id = v_caller
  limit 1;
  if v_seller is null then
    raise exception 'Permission denied: not a participant' using errcode = '42501';
  end if;
  return v_buyer;
end;
$$;

-- Gets or creates the conversation between the acting user and their
-- counterparty for an order. Returns the conversation id.
create or replace function public.create_or_get_conversation(p_order_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_buyer  uuid;
  v_seller uuid;
  v_conv_id uuid;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required' using errcode = '42501';
  end if;

  if not public.conversation_participant(p_order_id) then
    raise exception 'Permission denied: not a participant' using errcode = '42501';
  end if;

  select user_id into v_buyer from public.orders where id = p_order_id;
  v_seller := public.conversation_counterpart(p_order_id);

  select id into v_conv_id from public.conversations
  where order_id = p_order_id and seller_id = v_seller;

  if v_conv_id is null then
    insert into public.conversations (order_id, buyer_id, seller_id)
    values (p_order_id, v_buyer, v_seller)
    returning id into v_conv_id;
  end if;

  return v_conv_id;
end;
$$;

-- Sends a message in a conversation the caller participates in, bumps the
-- conversation, and notifies the recipient (no self-notification).
create or replace function public.send_message(
  p_conversation_id uuid,
  p_body           text
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_recipient uuid;
  v_body text;
  v_id   uuid;
  v_sender_name text;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required' using errcode = '42501';
  end if;
  v_body := nullif(trim(p_body), '');
  if v_body is null then
    raise exception 'Message is empty' using errcode = '23514';
  end if;

  select case
           when c.buyer_id = v_caller then c.seller_id
           when c.seller_id = v_caller then c.buyer_id
           else null
         end
    into v_recipient
  from public.conversations c where c.id = p_conversation_id;

  if v_recipient is null then
    raise exception 'Permission denied: not a participant' using errcode = '42501';
  end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (p_conversation_id, v_caller, left(v_body, 2000))
  returning id into v_id;

  update public.conversations
  set last_message_at = now()
  where id = p_conversation_id;

  select coalesce(full_name, 'Pengguna') into v_sender_name
  from public.profiles where id = v_caller;

  perform public.notify_user(
    v_recipient, 'CHAT',
    'Pesan baru',
    left(v_sender_name || ': ' || v_body, 600),
    '/chat?order=' || (select order_id from public.conversations where id = p_conversation_id)
  );

  return v_id;
end;
$$;

-- The acting user marks every inbound message in a conversation as read.
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.messages m
  set is_read = true, read_at = now()
  where m.conversation_id = p_conversation_id
    and m.sender_id <> auth.uid()
    and m.is_read = false;
end;
$$;

-- ============================================================
-- EVENT-DRIVEN NOTIFICATIONS (triggers)
-- ============================================================

-- Notify the buyer on meaningful order status transitions.
create or replace function public.notify_order_status()
returns trigger
language plpgsql
as $$
declare
  v_title text := 'Pesanan diperbarui';
  v_link text := '/orders/' || new.id;
begin
  if (old.status is distinct from new.status) then
    case new.status
      when 'SHIPPED'    then v_title := 'Pesanan Anda telah dikirim';
      when 'DELIVERED'  then v_title := 'Pesanan Anda telah tiba';
      when 'COMPLETED'  then v_title := 'Pesanan Anda telah selesai';
      when 'CANCELLED'  then v_title := 'Pesanan Anda dibatalkan';
      else v_title := 'Pesanan diperbarui';
    end case;
    perform public.notify_user(new.user_id, 'ORDER_UPDATE', v_title, '', v_link);
  end if;
  return new;
end;
$$;

create trigger orders_notify_status
  after update of status on public.orders
  for each row execute function public.notify_order_status();

-- Notify the seller when a return is requested and the buyer when it resolves.
create or replace function public.notify_return_status()
returns trigger
language plpgsql
as $$
declare
  v_seller uuid;
  v_buyer  uuid;
  v_link   text;
begin
  select s.owner_id, o.user_id into v_seller, v_buyer
  from public.order_items oi
  join public.stores s on s.id = oi.store_id
  join public.orders o on o.id = oi.order_id
  where oi.id = new.order_item_id;

  if (old.status is distinct from new.status) and new.status = 'REQUESTED' then
    perform public.notify_user(v_seller, 'RETURN_UPDATE', 'Permintaan pengembalian baru',
      'Sebuah pengembalian menunggu keputusan Anda.', '/seller/returns');
  elsif (old.status is distinct from new.status) and new.status in ('REFUNDED','REJECTED','CANCELLED') then
    perform public.notify_user(v_buyer, 'RETURN_UPDATE',
      'Status pengembalian: ' || replace(new.status,'_',' '),
      coalesce(new.seller_note,''), '/orders/' || new.order_id || '?returned=1');
  end if;
  return new;
end;
$$;

create trigger returns_notify_status
  after update of status on public.returns
  for each row execute function public.notify_return_status();

-- Notify admins when a new dispute is opened.
create or replace function public.notify_dispute_opened()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_admin uuid;
begin
  for v_admin in
    select id from public.profiles where role in ('ADMIN','SUPER_ADMIN')
  loop
    perform public.notify_user(v_admin, 'DISPUTE', 'Sengketa baru',
      'Sebuah sengketa menunggu keputusan.', '/admin/disputes');
  end loop;
  return new;
end;
$$;

create trigger disputes_notify_open
  after insert on public.disputes
  for each row execute function public.notify_dispute_opened();