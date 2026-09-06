-- ============================================================
-- Warungpedia migration 010 — Support chat (user → admin)
-- ============================================================
-- One‑to‑one conversation per user for support. Admins can read all.
-- Messages are stored in `support_messages` and are delivered via
-- Supabase Realtime to the UI.

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------
-- Table: support_conversations
-- ----------------------------------------------------------------
create table if not exists public.support_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index support_conversations_user_idx on public.support_conversations (user_id);

-- ----------------------------------------------------------------
-- Table: support_messages
-- ----------------------------------------------------------------
create table if not exists public.support_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.support_conversations (id) on delete cascade,
  sender_id        uuid not null references public.profiles (id),
  body             text not null,
  is_read          boolean not null default false,
  read_at          timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists support_messages_conversation_created_idx on public.support_messages (conversation_id, created_at asc);
create index if not exists support_messages_unread_idx on public.support_messages (conversation_id) where is_read = false;

-- Enable Realtime for live chat
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.support_messages;
  end if;
exception when others then
  null;
end $$;

-- ----------------------------------------------------------------
-- Row‑Level Security
-- ----------------------------------------------------------------
alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;

-- Users can read/write their own conversation and messages.
create policy "support_conversations_user_select"
  on public.support_conversations for select using (user_id = auth.uid());
create policy "support_conversations_user_insert"
  on public.support_conversations for insert with check (user_id = auth.uid());
create policy "support_conversations_user_update"
  on public.support_conversations for update using (user_id = auth.uid());

create policy "support_messages_user_select"
  on public.support_messages for select using (
    (select user_id from public.support_conversations where id = conversation_id) = auth.uid()
  );
create policy "support_messages_user_insert"
  on public.support_messages for insert with check (
    (select user_id from public.support_conversations where id = conversation_id) = auth.uid()
  );
create policy "support_messages_user_update"
  on public.support_messages for update using (
    (select user_id from public.support_conversations where id = conversation_id) = auth.uid()
  );

-- Admins may read all support data.
create policy "support_conversations_admin_select"
  on public.support_conversations for select using (public.current_role() in ('ADMIN','SUPER_ADMIN'));
create policy "support_messages_admin_select"
  on public.support_messages for select using (public.current_role() in ('ADMIN','SUPER_ADMIN'));

-- ----------------------------------------------------------------
-- Triggers & helper functions
-- ----------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists support_conversations_updated_at on public.support_conversations;
create trigger support_conversations_updated_at
  before update on public.support_conversations
  for each row execute function public.set_updated_at();

-- Mark a conversation as read (used by the service).
create or replace function public.mark_support_conversation_read(p_conversation_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.support_messages
  set is_read = true, read_at = now()
  where conversation_id = p_conversation_id
    and sender_id <> auth.uid()
    and is_read = false;
end;
$$;

-- Grant execute to all authenticated users.
grant execute on function public.mark_support_conversation_read(uuid) to anon, authenticated;

-- End of migration
