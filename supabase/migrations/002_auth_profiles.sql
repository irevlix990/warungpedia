-- ============================================================
-- Warungpedia migration 002 — Auth & profiles foundation
-- ============================================================
-- Defines: settings (configurable marketplace settings), profiles
-- (one row per auth user, holds role + profile fields), addresses,
-- RLS policies, and the RBAC helper used by RLS.

-- --- Settings ---------------------------------------------------
-- Configurable marketplace-wide settings (global commission, minimum
-- withdrawal, return window, ...). Value is JSONB so each setting can
-- hold a scalar or structured value. Referenced by public.app_setting().
create table if not exists public.settings (
  key          text primary key,
  value        jsonb not null,
  description  text,
  updated_at   timestamptz not null default now()
);

-- --- Profiles ---------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  full_name           text not null default '',
  phone               text,
  avatar_url          text,
  role                text not null default 'BUYER'
                        check (role in ('BUYER','SELLER','ADMIN','SUPER_ADMIN')),
  preferred_locale    text not null default 'id' check (preferred_locale in ('id','en')),
  theme_preference    text not null default 'system'
                        check (theme_preference in ('light','dark','system')),
  email_verified      boolean,
  notification_prefs  jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email_confirmed_at is not null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep email_verified in sync when a user confirms email / changes email.
create or replace function public.sync_email_verified()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set email_verified = (new.email_confirmed_at is not null)
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update on auth.users
  for each row when (old.email_confirmed_at is distinct from new.email_confirmed_at)
  execute function public.sync_email_verified();

-- --- RBAC helper for RLS ----------------------------------------
create or replace function public.current_role()
returns text
language sql
stable
security definer set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'BUYER'
  );
$$;

-- --- Addresses --------------------------------------------------
create table if not exists public.addresses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  label          text not null default 'Alamat' ,
  recipient_name text not null,
  phone          text not null,
  street         text not null,
  district       text,
  city           text not null,
  province       text not null,
  postal_code    text,
  country        text not null default 'Indonesia',
  latitude       double precision,
  longitude      double precision,
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);
create index addresses_default_idx on public.addresses (user_id) where is_default;

create trigger addresses_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

-- Only one default address per user: clear other defaults.
create or replace function public.enforce_single_default_address()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.is_default then
    update public.addresses
    set is_default = false
    where user_id = new.user_id and id <> new.id;
  end if;
  return new;
end;
$$;

create trigger addresses_default_unique
  before insert or update on public.addresses
  for each row when (new.is_default)
  execute function public.enforce_single_default_address();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.settings enable row level security;

-- --- profiles policies ------------------------------------------
-- Users can read/update their own profile. Admin access uses the
-- service-role client (bypasses RLS), so no current_role() here —
-- calling it would recurse (current_role reads profiles).
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Insert is handled by the auth trigger; block direct inserts from RLS.
create policy "profiles_no_insert"
  on public.profiles for insert
  with check (false);

-- --- addresses policies -----------------------------------------
create policy "addresses_select_own"
  on public.addresses for select
  using (user_id = auth.uid() or public.current_role() in ('ADMIN','SUPER_ADMIN'));

create policy "addresses_insert_own"
  on public.addresses for insert
  with check (user_id = auth.uid());

create policy "addresses_update_own"
  on public.addresses for update
  using (user_id = auth.uid() or public.current_role() in ('ADMIN','SUPER_ADMIN'))
  with check (user_id = auth.uid() or public.current_role() in ('ADMIN','SUPER_ADMIN'));

create policy "addresses_delete_own"
  on public.addresses for delete
  using (user_id = auth.uid() or public.current_role() in ('ADMIN','SUPER_ADMIN'));

-- --- settings policies ------------------------------------------
-- Settings are read by all authenticated users; only admins can change.
create policy "settings_select"
  on public.settings for select
  using (auth.role() = 'authenticated' or public.current_role() in ('ADMIN','SUPER_ADMIN'));

create policy "settings_admin_write"
  on public.settings for all
  using (public.current_role() in ('ADMIN','SUPER_ADMIN'))
  with check (public.current_role() in ('ADMIN','SUPER_ADMIN'));

-- ============================================================
-- Seed default settings
-- ============================================================
insert into public.settings (key, value, description) values
  ('global_commission_rate', '0.05', 'Global commission rate for sellers (fraction of order value).'),
  ('min_withdrawal_amount',  '100000', 'Minimum seller withdrawal amount (IDR).'),
  ('return_window_days',     '3', 'Maximum days after delivery to request a return.')
on conflict (key) do nothing;
