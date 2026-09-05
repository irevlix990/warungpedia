-- ============================================================
-- Warungpedia CLEAN COMPLETE MIGRATION
-- Structured in strict dependency order for a single-run execution.
-- ============================================================

-- ============================================================
-- STEP 1: EXTENSIONS & BASE TRIGGER FUNCTIONS
-- ============================================================
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "pg_net";

-- Shared timestamp-update trigger used by almost every table
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- STEP 2: SETTINGS & PROFILES FOUNDATION (Migration 002)
-- ============================================================

-- Configurable marketplace-wide settings
create table if not exists public.settings (
  key          text primary key,
  value        jsonb not null,
  description  text,
  updated_at   timestamptz not null default now()
);

-- Common app settings helper (now safe since settings table exists)
create or replace function public.app_setting(p_key text)
returns text
language sql
stable
security definer
as $$
  select value from public.settings where key = p_key;
$$;

-- Profiles
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

-- RBAC helper for RLS
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

-- Addresses
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

-- Only one default address per user
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

-- RLS
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.settings enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "addresses_all_owner"
  on public.addresses for all
  using (user_id = auth.uid() or public.current_role() in ('ADMIN','SUPER_ADMIN'))
  with check (user_id = auth.uid() or public.current_role() in ('ADMIN','SUPER_ADMIN'));

create policy "settings_select_all"
  on public.settings for select
  using (true);

create policy "settings_write_admin"
  on public.settings for all
  using (public.current_role() in ('ADMIN','SUPER_ADMIN'))
  with check (public.current_role() in ('ADMIN','SUPER_ADMIN'));


-- ============================================================
-- END OF FOUNDATION (001 + 002 resolved)
-- ============================================================

-- ============================================================
-- Warungpedia migration 003 — Catalog foundation (categories)
-- ============================================================
-- Defines the hierarchical `categories` table that drives the homepage,
-- catalog browsing, and the product taxonomy (products attach to it in a
-- later phase), plus RLS rules: anyone can browse active categories,
-- only admins manage the taxonomy.
--
-- Demo taxonomy is seeded from supabase/seed/catalog.sql (not here), so
-- migrations stay schema-only and the demo data stays clearly labeled.

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  parent_id   uuid references public.categories (id) on delete cascade,
  image_url   text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index categories_parent_idx on public.categories (parent_id)
  where parent_id is not null;

create index categories_sort_order_idx on public.categories (sort_order)
  where is_active;

create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.categories enable row level security;

-- The public catalog: anyone (including anonymous visitors) can browse
-- active categories; admins additionally manage inactive rows.
create policy "categories_select_public"
  on public.categories for select
  using (is_active = true or public.current_role() in ('ADMIN','SUPER_ADMIN'));

-- Only admins / super admins may create, update or delete taxonomy rows.
create policy "categories_admin_write"
  on public.categories for all
  using (public.current_role() in ('ADMIN','SUPER_ADMIN'))
  with check (public.current_role() in ('ADMIN','SUPER_ADMIN'));

-- ============================================================
-- END OF MIGRATION: 003_catalog.sql
-- ============================================================

-- ============================================================
-- Warungpedia migration 004 — Seller system (stores)
-- ============================================================
-- Defines `stores`: the seller-owned entity behind every storefront.
-- A store is created by a BUYER as a PENDING application, reviewed by an
-- admin (security-definer functions below), and only becomes ACTIVE after
-- approval — at which point the owner's profile role is elevated to SELLER.
--
-- Roles are never self-assigned: RLS lets an owner create/update their own
-- PENDING (or REJECTED → resubmit) row, and any attempt to set status to
-- 'ACTIVE' by the owner fails at the RLS layer. Approval/suspension only
-- happens through the admin-only definer functions.

create table if not exists public.stores (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null unique references public.profiles (id) on delete cascade,
  slug            text not null unique,
  name            text not null,
  tagline         text,
  description     text,
  logo_url        text,
  banner_url      text,
  contact_email   text not null default '',
  phone           text,
  province        text,
  city            text,
  status          text not null default 'PENDING'
                    check (status in ('PENDING','ACTIVE','REJECTED','SUSPENDED','CLOSED')),
  rejection_reason text,
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index stores_status_idx on public.stores (status);
create index stores_owner_idx on public.stores (owner_id);

create trigger stores_updated_at
  before update on public.stores
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.stores enable row level security;

-- Read: the public storefront shows ACTIVE stores; owners can always see
-- their own application; admins see everything.
create policy "stores_select_public"
  on public.stores for select
  using (
    status = 'ACTIVE'
    or owner_id = auth.uid()
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Create: a user may open exactly one application (unique owner_id) with a
-- PENDING status. They cannot self-approve.
create policy "stores_insert_owner_pending"
  on public.stores for insert
  with check (owner_id = auth.uid() and status = 'PENDING');

-- Update: owners may edit their own row but can only set status to PENDING
-- (editing a draft, or resubmitting a rejected application). Only admins may
-- move a store into ACTIVE / SUSPENDED / CLOSED (done via definer functions
-- in practice, but the RLS rule closes the loop).
create policy "stores_update_owner_pending"
  on public.stores for update
  using (owner_id = auth.uid() or public.current_role() in ('ADMIN','SUPER_ADMIN'))
  with check (
    (owner_id = auth.uid() and status = 'PENDING')
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Delete: administrative only. Sellers close stores via deny_close_store()
-- (status CLOSED), they never hard-delete.
create policy "stores_delete_admin"
  on public.stores for delete
  using (public.current_role() in ('ADMIN','SUPER_ADMIN'));

-- ============================================================
-- Store mutation functions (security definer)
-- ============================================================
-- All store writes from the app flow through these definer functions so the
-- transition rules live in one auditable place and never depend on a client
-- being careful with RLS. Functions verify ownership/roles internally.

-- Open a store application. Only a BUYER (no store yet) may create one;
-- the store is created as PENDING and can never be self-approved.
create or replace function public.create_store_application(
  p_slug text,
  p_name text,
  p_tagline text,
  p_description text,
  p_contact_email text,
  p_phone text,
  p_province text,
  p_city text,
  p_logo_url text,
  p_banner_url text
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_store_id uuid;
begin
  if v_owner is null then
    raise exception 'Permission denied: sign in required' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.profiles
    where id = v_owner and role in ('SELLER','ADMIN','SUPER_ADMIN')
  ) then
    raise exception 'Only buyers can open a store application'
      using errcode = '42501';
  end if;

  insert into public.stores (
    owner_id, slug, name, tagline, description, contact_email,
    phone, province, city, logo_url, banner_url, status
  )
  values (
    v_owner, p_slug, p_name, nullif(p_tagline, ''), nullif(p_description, ''),
    p_contact_email, nullif(p_phone, ''), p_province, p_city,
    nullif(p_logo_url, ''), nullif(p_banner_url, ''), 'PENDING'
  )
  returning id into v_store_id;

  return v_store_id;
end;
$$;

-- Update store details. Owners may edit their store while PENDING / ACTIVE /
-- REJECTED (never when SUSPENDED/CLOSED); admins may edit any store. The
-- status column is never changed here.
create or replace function public.update_store(
  p_store_id uuid,
  p_name text,
  p_tagline text,
  p_description text,
  p_contact_email text,
  p_phone text,
  p_province text,
  p_city text,
  p_logo_url text,
  p_banner_url text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare v_owner uuid;
begin
  select owner_id into v_owner from public.stores where id = p_store_id;

  if v_owner is null then
    raise exception 'Store not found' using errcode = 'P0002';
  end if;

  if v_owner <> auth.uid() and public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: store owner or admin required'
      using errcode = '42501';
  end if;

  if v_owner = auth.uid() and exists (
    select 1 from public.stores
    where id = p_store_id and status in ('SUSPENDED','CLOSED')
  ) then
    raise exception 'Suspended or closed stores cannot be edited'
      using errcode = '42501';
  end if;

  update public.stores
  set name = p_name,
      tagline = nullif(p_tagline, ''),
      description = nullif(p_description, ''),
      contact_email = p_contact_email,
      phone = nullif(p_phone, ''),
      province = p_province,
      city = p_city,
      logo_url = nullif(p_logo_url, ''),
      banner_url = nullif(p_banner_url, ''),
      updated_at = now()
  where id = p_store_id;
end;
$$;

-- Resubmit a rejected application: moves it back to PENDING (clears reason).
create or replace function public.resubmit_store(p_store_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare v_owner uuid;
begin
  select owner_id into v_owner from public.stores where id = p_store_id;

  if v_owner is null then
    raise exception 'Store not found' using errcode = 'P0002';
  end if;

  if v_owner <> auth.uid() then
    raise exception 'Permission denied: store owner required'
      using errcode = '42501';
  end if;

  update public.stores
  set status = 'PENDING', rejection_reason = null, approved_at = null, updated_at = now()
  where id = p_store_id and status = 'REJECTED';

  if not found then
    raise exception 'Only rejected applications can be resubmitted'
      using errcode = 'P0002';
  end if;
end;
$$;

-- ============================================================
-- Admin review functions (security definer)
-- ============================================================
-- These bypass RLS but verify the caller's admin status inside the function,
-- so elevation can never be triggered by a non-admin client.

-- Approve: store becomes ACTIVE and the owner's role is elevated to SELLER.
create or replace function public.approve_store(p_store_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin role required'
      using errcode = '42501';
  end if;

  update public.stores
  set status = 'ACTIVE', rejection_reason = null, approved_at = now()
  where id = p_store_id;

  update public.profiles
  set role = 'SELLER'
  where id = (
    select owner_id from public.stores where id = p_store_id
  );

  if not found then
    raise exception 'Store not found' using errcode = 'P0002';
  end if;
end;
$$;

-- Reject: store stays visible to its owner with a reason; role unchanged.
create or replace function public.reject_store(p_store_id uuid, p_reason text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin role required'
      using errcode = '42501';
  end if;

  update public.stores
  set status = 'REJECTED', rejection_reason = p_reason, approved_at = null
  where id = p_store_id;

  if not found then
    raise exception 'Store not found' using errcode = 'P0002';
  end if;
end;
$$;

-- Suspend: hide the storefront (public select requires ACTIVE).
create or replace function public.suspend_store(p_store_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin role required'
      using errcode = '42501';
  end if;

  update public.stores
  set status = 'SUSPENDED', approved_at = null
  where id = p_store_id;

  if not found then
    raise exception 'Store not found' using errcode = 'P0002';
  end if;
end;
$$;

-- Close: owner-initiated or admin. Status becomes CLOSED (storefront hidden).
create or replace function public.close_store(p_store_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare v_owner uuid;
begin
  select owner_id into v_owner from public.stores where id = p_store_id;

  if v_owner is null then
    raise exception 'Store not found' using errcode = 'P0002';
  end if;

  if v_owner <> auth.uid() and public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: store owner or admin required'
      using errcode = '42501';
  end if;

  update public.stores set status = 'CLOSED' where id = p_store_id;
end;
$$;

-- ============================================================
-- END OF MIGRATION: 004_stores.sql
-- ============================================================

-- ============================================================
-- Warungpedia migration 005 — Product & inventory
-- ============================================================
-- Defines `products`: the seller-managed catalog items displayed in
-- storefronts. Each product belongs to an ACTIVE store, may optionally
-- reference a category, and carries integer-IDR pricing, stock, image
-- URLs, and a lifecycle status (DRAFT → ACTIVE → ARCHIVED).
--
-- Writes are routed through security-definer functions so ownership,
-- store status, and lifecycle transitions are enforced centrally.

create table if not exists public.products (
  id                   uuid primary key default gen_random_uuid(),
  store_id             uuid not null references public.stores (id) on delete cascade,
  category_id          uuid references public.categories (id) on delete set null,
  slug                 text not null,
  name                 text not null,
  description          text,
  brand                text,
  condition            text not null default 'new'
                         check (condition in ('new','used')),
  price                integer not null check (price >= 0),
  compare_at_price     integer check (compare_at_price is null or compare_at_price > price),
  image_urls           text[] not null default '{}',
  stock                integer not null default 0 check (stock >= 0),
  low_stock_threshold  integer not null default 5 check (low_stock_threshold >= 0),
  weight_grams         integer check (weight_grams is null or weight_grams >= 0),
  status               text not null default 'DRAFT'
                         check (status in ('DRAFT','ACTIVE','ARCHIVED')),
  is_featured          boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (store_id, slug)
);

create index products_store_idx on public.products (store_id);
create index products_category_idx on public.products (category_id)
  where category_id is not null;
create index products_status_idx on public.products (status);
create index products_active_store_idx on public.products (store_id)
  where status = 'ACTIVE';

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.products enable row level security;

-- Read: active products from an active store (public browse); the store
-- owner sees all their own products (any status); admins see everything.
create policy "products_select_public"
  on public.products for select
  using (
    (
      status = 'ACTIVE'
      and exists (
        select 1 from public.stores
        where id = store_id and status = 'ACTIVE'
      )
    )
    or exists (
      select 1 from public.stores
      where id = store_id and owner_id = auth.uid()
    )
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Insert: owners of an ACTIVE store only. The definer function verifies
-- store ownership and status; RLS is defense-in-depth.
create policy "products_insert_owner"
  on public.products for insert
  with check (
    exists (
      select 1 from public.stores
      where id = store_id and owner_id = auth.uid()
    )
  );

-- Update: store owners and admins. Definer functions verify store status.
create policy "products_update_owner"
  on public.products for update
  using (
    exists (
      select 1 from public.stores
      where id = store_id and owner_id = auth.uid()
    )
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Delete: admin only by default. Sellers archive via set_product_status;
-- the definer function allows sellers to delete DRAFT/ARCHIVED only.
create policy "products_delete_admin"
  on public.products for delete
  using (public.current_role() in ('ADMIN','SUPER_ADMIN'));

-- ============================================================
-- Product mutation functions (security definer)
-- ============================================================

-- Create a product (defaults to DRAFT). The caller must own the store and
-- the store must be ACTIVE.
create or replace function public.create_product(
  p_store_id      uuid,
  p_category_id   uuid,
  p_slug          text,
  p_name          text,
  p_description   text,
  p_brand         text,
  p_condition     text,
  p_price         integer,
  p_compare_at_price integer,
  p_image_urls    text[],
  p_stock         integer,
  p_low_stock_threshold integer,
  p_weight_grams  integer,
  p_status        text
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_product_id uuid;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required'
      using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.stores
    where id = p_store_id and owner_id = v_caller and status = 'ACTIVE'
  ) then
    raise exception 'Store not found or not active'
      using errcode = 'P0002';
  end if;

  insert into public.products (
    store_id, category_id, slug, name, description, brand, condition,
    price, compare_at_price, image_urls, stock, low_stock_threshold,
    weight_grams, status
  )
  values (
    p_store_id,
    nullif(p_category_id, '00000000-0000-0000-0000-000000000000'::uuid),
    p_slug,
    p_name,
    nullif(p_description, ''),
    nullif(p_brand, ''),
    coalesce(nullif(p_condition, ''), 'new'),
    p_price,
    nullif(p_compare_at_price, 0),
    coalesce(p_image_urls, '{}'),
    coalesce(p_stock, 0),
    coalesce(p_low_stock_threshold, 5),
    nullif(p_weight_grams, 0),
    coalesce(nullif(p_status, ''), 'DRAFT')
  )
  returning id into v_product_id;

  return v_product_id;
end;
$$;

-- Update product details (name, slug, description, price, images, etc.).
-- Stock and status are managed through dedicated functions. The caller must
-- own the store (ACTIVE) or be an admin.
create or replace function public.update_product(
  p_product_id         uuid,
  p_category_id        uuid,
  p_slug               text,
  p_name               text,
  p_description        text,
  p_brand              text,
  p_condition          text,
  p_price              integer,
  p_compare_at_price   integer,
  p_image_urls         text[],
  p_low_stock_threshold integer,
  p_weight_grams       integer,
  p_is_featured        boolean
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_store_id uuid;
  v_owner    uuid;
begin
  select s.owner_id, s.id into v_owner, v_store_id
  from public.products p
  join public.stores  s on s.id = p.store_id
  where p.id = p_product_id;

  if v_store_id is null then
    raise exception 'Product not found' using errcode = 'P0002';
  end if;

  if v_owner <> auth.uid()
     and public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: store owner or admin required'
      using errcode = '42501';
  end if;

  update public.products
  set category_id      = nullif(p_category_id, '00000000-0000-0000-0000-000000000000'::uuid),
      slug              = p_slug,
      name              = p_name,
      description       = nullif(p_description, ''),
      brand             = nullif(p_brand, ''),
      condition         = coalesce(nullif(p_condition, ''), 'new'),
      price             = p_price,
      compare_at_price  = nullif(p_compare_at_price, 0),
      image_urls        = coalesce(p_image_urls, '{}'),
      low_stock_threshold = coalesce(p_low_stock_threshold, 5),
      weight_grams      = nullif(p_weight_grams, 0),
      is_featured       = p_is_featured
  where id = p_product_id;
end;
$$;

-- Set product status (lifecycle transitions). Owner may set DRAFT/ACTIVE/
-- ARCHIVED on their own products; admins may set any status. Owners require
-- an ACTIVE store for DRAFT→ACTIVE transitions.
create or replace function public.set_product_status(
  p_product_id uuid,
  p_status     text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner   uuid;
  v_store   uuid;
  v_current text;
begin
  select s.owner_id, s.id, p.status into v_owner, v_store, v_current
  from public.products p
  join public.stores   s on s.id = p.store_id
  where p.id = p_product_id;

  if v_store is null then
    raise exception 'Product not found' using errcode = 'P0002';
  end if;

  if v_owner <> auth.uid()
     and public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: store owner or admin required'
      using errcode = '42501';
  end if;

  if v_owner = auth.uid() then
    if p_status not in ('DRAFT','ACTIVE','ARCHIVED') then
      raise exception 'Invalid status: sellers may set DRAFT, ACTIVE, or ARCHIVED'
        using errcode = '23514';
    end if;

    if p_status = 'ACTIVE' and not exists (
      select 1 from public.stores where id = v_store and status = 'ACTIVE'
    ) then
      raise exception 'Cannot publish: store is not active'
        using errcode = '42501';
    end if;
  end if;

  update public.products
  set status = p_status, updated_at = now()
  where id = p_product_id;
end;
$$;

-- Set product stock. Owner (ACTIVE store) or admin.
create or replace function public.set_product_stock(
  p_product_id uuid,
  p_stock      integer
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid;
  v_store uuid;
begin
  select s.owner_id, s.id into v_owner, v_store
  from public.products p
  join public.stores   s on s.id = p.store_id
  where p.id = p_product_id;

  if v_store is null then
    raise exception 'Product not found' using errcode = 'P0002';
  end if;

  if v_owner <> auth.uid()
     and public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: store owner or admin required'
      using errcode = '42501';
  end if;

  update public.products
  set stock = p_stock, updated_at = now()
  where id = p_product_id;
end;
$$;

-- Delete a product. Sellers may delete only DRAFT/ARCHIVED; admins may
-- delete any product. This is a hard delete; archive via set_product_status
-- for published items to preserve order-history references.
create or replace function public.delete_product(p_product_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner  uuid;
  v_status text;
begin
  select s.owner_id, p.status into v_owner, v_status
  from public.products p
  join public.stores   s on s.id = p.store_id
  where p.id = p_product_id;

  if v_owner is null then
    raise exception 'Product not found' using errcode = 'P0002';
  end if;

  if v_owner = auth.uid() then
    if v_status in ('ACTIVE') then
      raise exception 'Cannot delete an active product. Archive it first.'
        using errcode = '23514';
    end if;
  elsif public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: store owner or admin required'
      using errcode = '42501';
  end if;

  delete from public.products where id = p_product_id;
end;
$$;

-- ============================================================
-- END OF MIGRATION: 005_products.sql
-- ============================================================

-- ============================================================
-- Warungpedia migration 006 — Cart & checkout
-- ============================================================
-- Adds a per-user shopping cart and the order/order-items snapshot model.
-- Checkout is an all-or-nothing definer transaction: it locks products,
-- validates purchasability, decrements stock, and snapshots prices atomically
-- so money is computed server-side and never trusted from the client.
--
-- Shipping fee is a placeholder (0) until the shipping phase; subtotal and
-- total are integer IDR computed inside `place_order`.

create table if not exists public.carts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id)
);

create index carts_user_idx on public.carts (user_id);

create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  cart_id     uuid not null references public.carts (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  quantity    integer not null default 1 check (quantity > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (cart_id, product_id)
);

create index cart_items_cart_idx on public.cart_items (cart_id);
create index cart_items_product_idx on public.cart_items (product_id);

create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  status       text not null default 'PENDING'
                 check (status in (
                   'PENDING','PAID','PROCESSING','SHIPPED','DELIVERED',
                   'COMPLETED','CANCELLED'
                 )),
  subtotal     integer not null check (subtotal >= 0),
  shipping_fee integer not null default 0 check (shipping_fee >= 0),
  total        integer not null check (total >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  store_id       uuid not null references public.stores (id),
  product_id     uuid references public.products (id) on delete set null,
  product_name   text not null,
  product_price  integer not null check (product_price >= 0),
  quantity       integer not null check (quantity > 0),
  weight_grams   integer check (weight_grams is null or weight_grams >= 0),
  created_at     timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_store_idx on public.order_items (store_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Carts: a user manages their own cart; admins see all.
create policy "carts_select_owner"
  on public.carts for select using (user_id = auth.uid());
create policy "carts_insert_owner"
  on public.carts for insert with check (user_id = auth.uid());
create policy "carts_update_owner"
  on public.carts for update using (user_id = auth.uid());
create policy "carts_delete_owner"
  on public.carts for delete using (user_id = auth.uid());

-- Cart items: scoped through the owning cart.
create policy "cart_items_owner"
  on public.cart_items
  using (exists (
    select 1 from public.carts
    where id = cart_id and user_id = auth.uid()
  ));

-- Orders: buyers see their own; admins see all.
create policy "orders_select_user"
  on public.orders for select using (
    user_id = auth.uid()
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );
create policy "orders_insert_user"
  on public.orders for insert with check (
    user_id = auth.uid()
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );
create policy "orders_update_admin"
  on public.orders for update using (
    public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Order items: visible to the buyer or the item's store owner.
create policy "order_items_select_user"
  on public.order_items for select using (
    exists (select 1 from public.orders
            where id = order_id and user_id = auth.uid())
    or exists (select 1 from public.stores
               where id = store_id and owner_id = auth.uid())
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- ============================================================
-- Cart mutation functions (security definer)
-- ============================================================

-- Ensure the user's cart row exists (lazily created on first add).
create or replace function public.ensure_cart(p_user_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_cart_id uuid;
begin
  select id into v_cart_id from public.carts where user_id = p_user_id;
  if v_cart_id is null then
    insert into public.carts (user_id) values (p_user_id)
    returning id into v_cart_id;
  end if;
  return v_cart_id;
end;
$$;

-- Add an item to the caller's cart. The product must be purchasable (ACTIVE,
-- in an ACTIVE store) and the resulting quantity must be a positive integer.
-- Quantity is capped to a sane maximum to avoid abuse.
create or replace function public.add_to_cart(
  p_product_id uuid,
  p_quantity   integer
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_cart_id uuid;
  v_item_id uuid;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required'
      using errcode = '42501';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 99 then
    raise exception 'Quantity must be between 1 and 99'
      using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.products p
    join public.stores s on s.id = p.store_id
    where p.id = p_product_id and p.status = 'ACTIVE' and s.status = 'ACTIVE'
  ) then
    raise exception 'Product is not available for purchase'
      using errcode = 'P0002';
  end if;

  v_cart_id := public.ensure_cart(v_caller);

  insert into public.cart_items (cart_id, product_id, quantity)
  values (v_cart_id, p_product_id, p_quantity)
  on conflict (cart_id, product_id)
  do update set quantity = least(
    public.cart_items.quantity + excluded.quantity,
    99
  ), updated_at = now()
  returning id into v_item_id;

  return v_item_id;
end;
$$;

-- Set an item's quantity directly (1..99). Verified against the owning cart.
create or replace function public.update_cart_item(
  p_item_id  uuid,
  p_quantity integer
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Permission denied: sign in required'
      using errcode = '42501';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 99 then
    raise exception 'Quantity must be between 1 and 99'
      using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.cart_items ci
    join public.carts c on c.id = ci.cart_id
    where ci.id = p_item_id and c.user_id = auth.uid()
  ) then
    raise exception 'Cart item not found' using errcode = 'P0002';
  end if;

  update public.cart_items
  set quantity = p_quantity, updated_at = now()
  where id = p_item_id;
end;
$$;

-- Remove an item from the caller's cart.
create or replace function public.remove_from_cart(p_item_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Permission denied: sign in required'
      using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.cart_items ci
    join public.carts c on c.id = ci.cart_id
    where ci.id = p_item_id and c.user_id = auth.uid()
  ) then
    raise exception 'Cart item not found' using errcode = 'P0002';
  end if;

  delete from public.cart_items where id = p_item_id;
end;
$$;

-- ============================================================
-- Checkout (security definer, single transaction)
-- ============================================================
-- Consumes the caller's entire cart and creates an order. All money is
-- recomputed from the product's CURRENT selling price inside the function;
-- the client is never trusted. Product rows are locked FOR UPDATE so a
-- concurrent checkout of the same product cannot oversell stock.
create or replace function public.place_order()
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller    uuid := auth.uid();
  v_cart_id   uuid;
  v_product_id uuid;
  v_quantity  integer;
  v_price     integer;
  v_weight    integer;
  v_store_id  uuid;
  v_stock     integer;
  v_product_status text;
  v_store_status  text;
  v_name      text;
  v_subtotal  integer := 0;
  v_order_id  uuid;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required'
      using errcode = '42501';
  end if;

  select id into v_cart_id from public.carts where user_id = v_caller;
  if v_cart_id is null then
    raise exception 'Cart is empty' using errcode = 'P0002';
  end if;

  insert into public.orders (user_id, status, subtotal, shipping_fee, total)
  values (v_caller, 'PENDING', 0, 0, 0)
  returning id into v_order_id;

  -- Lock the cart lines, then each product row, validating and snapshotting.
  for v_product_id, v_quantity in
    select product_id, quantity
    from public.cart_items
    where cart_id = v_cart_id
    for update
  loop
    select p.price, p.stock, p.weight_grams, p.store_id, p.name,
           p.status, s.status
      into v_price, v_weight, v_store_id, v_name,
           v_product_status, v_store_status
    from public.products p
    join public.stores s on s.id = p.store_id
    where p.id = v_product_id
    for update of p;

    if v_product_status is null then
      raise exception 'A product in your cart is no longer available'
        using errcode = 'P0002';
    end if;

    if v_product_status <> 'ACTIVE' or v_store_status <> 'ACTIVE' then
      raise exception 'A product in your cart is no longer available'
        using errcode = 'P0002';
    end if;

    if v_price < 0 then
      raise exception 'A product in your cart has an invalid price'
        using errcode = '23514';
    end if;

    -- Lock a fresh stock read for the decrement check.
    select stock into v_stock
    from public.products where id = v_product_id for update;
    if coalesce(v_stock, 0) < v_quantity then
      raise exception 'Insufficient stock' using errcode = 'P0002';
    end if;

    update public.products
    set stock = stock - v_quantity, updated_at = now()
    where id = v_product_id;

    insert into public.order_items (
      order_id, store_id, product_id, product_name, product_price,
      quantity, weight_grams
    )
    values (
      v_order_id, v_store_id, v_product_id, v_name, v_price,
      v_quantity, v_weight
    );

    v_subtotal := v_subtotal + (v_price * v_quantity);
  end loop;

  update public.orders
  set subtotal = v_subtotal,
      shipping_fee = 0,
      total = v_subtotal
  where id = v_order_id;

  delete from public.cart_items where cart_id = v_cart_id;
  delete from public.carts where id = v_cart_id;

  return v_order_id;
end;
$$;


-- ============================================================
-- END OF MIGRATION: 006_cart_checkout.sql
-- ============================================================

-- ============================================================
-- Warungpedia migration 007 — Payment & financial system
-- ============================================================
-- Adds the money layer: payments, seller wallets, an append-only ledger,
-- seller earnings, and withdrawal requests. All money is integer IDR and all
-- financial mutations run through security-definer functions inside a single
-- transaction so balances are never trusted from the client and the ledger
-- always reconciles.
--
-- Ledger: every wallet change writes an immutable ledger entry with a signed
-- `amount` (positive = credit) and the resulting `balance_after`.

-- Commission rate is stored in `settings` as key 'payments.commission_rate'
-- with a jsonb value like {"rate_bps": 500} (500 = 5%). The definer functions
-- read it directly so money math stays integer.

create table if not exists public.wallets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  balance     integer not null default 0 check (balance >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id)
);

create index wallets_user_idx on public.wallets (user_id);

create trigger wallets_updated_at
  before update on public.wallets
  for each row execute function public.set_updated_at();

-- Append-only ledger of wallet movements. `amount` is signed (positive
-- credit, negative debit); `balance_after` is the wallet balance after the
-- entry, persisted for reconciliation.
create table if not exists public.ledger_entries (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles (id) on delete cascade,
  amount              integer not null,
  balance_after       integer not null check (balance_after >= 0),
  type                text not null check (type in (
                        'SALE','COMMISSION','WITHDRAWAL','PAYMENT','REFUND',
                        'ADJUSTMENT'
                      )),
  reference_type      text,
  reference_id        uuid,
  description         text,
  created_at          timestamptz not null default now()
);

create index ledger_entries_user_idx on public.ledger_entries (user_id);
create index ledger_entries_user_time_idx on public.ledger_entries (user_id, created_at);

-- Order payments (collected from the buyer).
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  method          text not null check (method in ('WALLET','BANK_TRANSFER','COD')),
  amount          integer not null check (amount >= 0),
  status          text not null default 'PENDING'
                    check (status in ('PENDING','SUCCEEDED','FAILED')),
  reference       text,
  failure_reason  text,
  metadata        jsonb,
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id);
create index payments_user_idx on public.payments (user_id);

-- Seller earnings: per-line marketplace revenue recognized on payment.
create table if not exists public.seller_earnings (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  store_id    uuid not null references public.stores (id),
  user_id     uuid not null references public.profiles (id),
  order_item_id uuid references public.order_items (id) on delete set null,
  gross       integer not null check (gross >= 0),
  commission  integer not null default 0 check (commission >= 0),
  net         integer not null check (net >= 0),
  status      text not null default 'AVAILABLE'
                check (status in ('AVAILABLE','PAID_OUT')),
  created_at  timestamptz not null default now(),
  paid_out_at timestamptz
);

create index seller_earnings_user_idx on public.seller_earnings (user_id);
create index seller_earnings_order_idx on public.seller_earnings (order_id);

-- Seller withdrawal requests against their wallet balance.
create table if not exists public.withdrawals (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles (id) on delete cascade,
  amount              integer not null check (amount > 0),
  status              text not null default 'PENDING'
                        check (status in ('PENDING','PROCESSING','PAID','REJECTED')),
  bank_name           text not null,
  bank_account_number text not null,
  bank_account_name   text not null,
  rejection_reason    text,
  created_at          timestamptz not null default now(),
  processed_at        timestamptz,
  updated_at          timestamptz not null default now()
);

create index withdrawals_user_idx on public.withdrawals (user_id);
create index withdrawals_status_idx on public.withdrawals (status);

create trigger withdrawals_updated_at
  before update on public.withdrawals
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.wallets enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.payments enable row level security;
alter table public.seller_earnings enable row level security;
alter table public.withdrawals enable row level security;

-- Wallets: owner reads/writes their own; admins see all.
create policy "wallets_select_owner"
  on public.wallets for select using (user_id = auth.uid());
create policy "wallets_update_admin"
  on public.wallets for update using (
    public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Ledger: owner sees their own; admins see all.
create policy "ledger_select_owner"
  on public.ledger_entries for select using (
    user_id = auth.uid()
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Payments: buyer sees their own; sellers see payments on their orders via
-- order linkage; admins see all.
create policy "payments_select_user"
  on public.payments for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.orders where id = order_id and user_id = auth.uid()
    )
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Seller earnings: the seller sees their own; admins see all.
create policy "seller_earnings_select_user"
  on public.seller_earnings for select using (
    user_id = auth.uid()
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Withdrawals: the seller sees/manages their own; admins see all.
create policy "withdrawals_select_user"
  on public.withdrawals for select using (
    user_id = auth.uid()
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );
create policy "withdrawals_insert_owner"
  on public.withdrawals for insert with check (user_id = auth.uid());
create policy "withdrawals_update_admin"
  on public.withdrawals for update using (
    public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- ============================================================
-- Financial functions (security definer, single transaction)
-- ============================================================

-- Ensure a wallet row exists for a user, creating it lazily.
create or replace function public.ensure_wallet(p_user_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_wallet_id uuid;
begin
  select id into v_wallet_id from public.wallets where user_id = p_user_id;
  if v_wallet_id is null then
    insert into public.wallets (user_id) values (p_user_id)
    returning id into v_wallet_id;
  end if;
  return v_wallet_id;
end;
$$;

-- Credit a wallet and write a ledger entry. Returns the new balance.
create or replace function public.credit_wallet(
  p_user_id uuid,
  p_amount  integer,
  p_type    text,
  p_ref_type text,
  p_ref_id  uuid,
  p_description text
)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_wallet_id uuid;
  v_new_balance integer;
begin
  if p_amount is null or p_amount < 0 then
    raise exception 'Invalid amount' using errcode = '23514';
  end if;

  v_wallet_id := public.ensure_wallet(p_user_id);

  update public.wallets
  set balance = balance + p_amount
  where id = v_wallet_id
  returning balance into v_new_balance;

  insert into public.ledger_entries (
    user_id, amount, balance_after, type, reference_type, reference_id, description
  )
  values (p_user_id, p_amount, v_new_balance, p_type, p_ref_type, p_ref_id, p_description);

  return v_new_balance;
end;
$$;

-- Debit a wallet (with sufficient balance) and write a ledger entry.
create or replace function public.debit_wallet(
  p_user_id uuid,
  p_amount  integer,
  p_type    text,
  p_ref_type text,
  p_ref_id  uuid,
  p_description text
)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_wallet_id uuid;
  v_balance   integer;
  v_new_balance integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid amount' using errcode = '23514';
  end if;

  v_wallet_id := public.ensure_wallet(p_user_id);

  select balance into v_balance
  from public.wallets where id = v_wallet_id for update;

  if coalesce(v_balance, 0) < p_amount then
    raise exception 'Insufficient wallet balance' using errcode = 'P0002';
  end if;

  update public.wallets
  set balance = balance - p_amount
  where id = v_wallet_id
  returning balance into v_new_balance;

  insert into public.ledger_entries (
    user_id, amount, balance_after, type, reference_type, reference_id, description
  )
  values (p_user_id, -p_amount, v_new_balance, p_type, p_ref_type, p_ref_id, p_description);

  return v_new_balance;
end;
$$;

-- Read the commission rate in basis points from settings (default 500 = 5%).
create or replace function public.commission_rate_bps()
returns integer
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_bps integer;
begin
  select (value->>'rate_bps')::int into v_bps
  from public.settings where key = 'payments.commission_rate';
  return coalesce(v_bps, 500);
end;
$$;

-- Pay for a PENDING order. Marks the payment SUCCEEDED and the order PAID,
-- then recognizes seller earnings (gross line, marketplace commission, net
-- credited to the seller wallet with ledger entries) in the same transaction.
create or replace function public.pay_order(p_order_id uuid, p_method text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller    uuid := auth.uid();
  v_buyer     uuid;
  v_order_status text;
  v_payment_id uuid;
  v_line      record;
  v_gross     integer;
  v_commission integer;
  v_net       integer;
  v_bps       integer := public.commission_rate_bps();
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required'
      using errcode = '42501';
  end if;

  select o.user_id, o.status, o.total
    into v_buyer, v_order_status, v_gross
  from public.orders o where o.id = p_order_id for update;

  if v_buyer is null then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;
  if v_buyer <> v_caller then
    raise exception 'Permission denied: not your order' using errcode = '42501';
  end if;
  if v_order_status <> 'PENDING' then
    raise exception 'Order is not pending payment' using errcode = '23514';
  end if;

  insert into public.payments (order_id, user_id, method, amount, status, paid_at)
  values (p_order_id, v_caller, p_method, v_gross, 'SUCCEEDED', now())
  returning id into v_payment_id;

  update public.orders set status = 'PAID', updated_at = now()
  where id = p_order_id;

  -- Recognize earnings per order line.
  for v_line in
    select oi.id as order_item_id, oi.store_id, s.owner_id as seller,
           oi.product_price * oi.quantity as line_total
    from public.order_items oi
    join public.stores s on s.id = oi.store_id
    where oi.order_id = p_order_id
  loop
    v_gross := v_line.line_total;
    v_commission := floor(v_gross * v_bps / 10000);
    v_net := v_gross - v_commission;

    if v_net > 0 then
      perform public.credit_wallet(
        v_line.seller, v_net, 'SALE', 'order', p_order_id,
        'Penjualan pesanan'
      );
    end if;

    insert into public.seller_earnings (
      order_id, store_id, user_id, order_item_id, gross, commission, net, status
    )
    values (p_order_id, v_line.store_id, v_line.seller, v_line.order_item_id,
            v_gross, v_commission, v_net, 'AVAILABLE');
  end loop;

  return v_payment_id;
end;
$$;

-- Request a payout of the seller's wallet balance.
create or replace function public.request_withdrawal(
  p_amount              integer,
  p_bank_name           text,
  p_bank_account_number text,
  p_bank_account_name   text
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_balance integer;
  v_min    integer := 50000;
  v_withdrawal_id uuid;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required'
      using errcode = '42501';
  end if;

  select (value->>'min_amount')::int into v_min
  from public.settings where key = 'payments.withdrawal_min';

  if p_amount is null then
    raise exception 'Amount is required' using errcode = '23514';
  end if;
  if coalesce(v_min, 50000) > 0 and p_amount < coalesce(v_min, 50000) then
    raise exception 'Amount below the minimum withdrawal' using errcode = '23514';
  end if;

  select balance into v_balance
  from public.wallets where user_id = v_caller for update;

  if coalesce(v_balance, 0) < p_amount then
    raise exception 'Insufficient wallet balance' using errcode = 'P0002';
  end if;

  -- Reserve: mark a ledger debit to move funds into a pending withdrawal.
  perform public.debit_wallet(
    v_caller, p_amount, 'WITHDRAWAL', null, null, 'Penarikan dana'
  );

  insert into public.withdrawals (
    user_id, amount, bank_name, bank_account_number, bank_account_name
  )
  values (v_caller, p_amount, p_bank_name, p_bank_account_number, p_bank_account_name)
  returning id into v_withdrawal_id;

  return v_withdrawal_id;
end;
$$;

-- Admin approves a PENDING withdrawal (no extra wallet change — funds were
-- reserved at request time).
create or replace function public.approve_withdrawal(p_withdrawal_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.withdrawals
    where id = p_withdrawal_id and status = 'PENDING'
  ) then
    raise exception 'Withdrawal not found or not pending' using errcode = 'P0002';
  end if;

  update public.withdrawals
  set status = 'PROCESSING', processed_at = now()
  where id = p_withdrawal_id;
end;
$$;

-- Admin rejects a PENDING withdrawal and returns funds to the wallet.
create or replace function public.reject_withdrawal(
  p_withdrawal_id uuid,
  p_reason        text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_amount  integer;
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin required' using errcode = '42501';
  end if;

  select user_id, amount into v_user_id, v_amount
  from public.withdrawals
  where id = p_withdrawal_id and status = 'PENDING';

  if v_user_id is null then
    raise exception 'Withdrawal not found or not pending' using errcode = 'P0002';
  end if;

  -- Return the reserved funds to the wallet (reverse of the debit).
  perform public.credit_wallet(
    v_user_id, v_amount, 'ADJUSTMENT', 'withdrawal', p_withdrawal_id,
    'Penarikan dibatalkan'
  );

  update public.withdrawals
  set status = 'REJECTED', rejection_reason = p_reason, processed_at = now()
  where id = p_withdrawal_id;
end;
$$;


-- ============================================================
-- END OF MIGRATION: 007_financial.sql
-- ============================================================

-- ============================================================
-- Warungpedia migration 008 — Shipping, returns & disputes
-- ============================================================
-- Adds order fulfilment (shipments + tracking), line-level buyer returns
-- within a window, and admin-resolved disputes that reverse seller earnings
-- through the financial ledger when a return is approved. Money stays
-- integer IDR and every reversal flows through a security-definer function
-- so balances are never trusted from the client.

-- Return window (days from completion) is stored in `settings` under
-- 'returns.window_days' (jsonb {"days": 30}); the definers default to 30.

-- Extend the seller_earnings lifecycle with a REFUNDED terminal state so an
-- approved return can claw back the marketplace-recognized net.
alter table public.seller_earnings
  drop constraint seller_earnings_status_check;
alter table public.seller_earnings
  add constraint seller_earnings_status_check
  check (status in ('AVAILABLE','PAID_OUT','REFUNDED'));

-- Return reasons are a small admin-managed dictionary.
create table if not exists public.return_reasons (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  label       text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true
);

-- Shipment / tracking record for an order. One shipment per order.
create table if not exists public.shipments (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  carrier         text not null,
  tracking_number text not null,
  shipped_at      timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (order_id)
);

create index shipments_order_idx on public.shipments (order_id);

-- Buyer return request for a single order line.
create table if not exists public.returns (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  reason_id     uuid references public.return_reasons (id),
  note          text not null default '',
  status        text not null default 'REQUESTED'
                  check (status in (
                    'REQUESTED','APPROVED','REJECTED','REFUNDED','CANCELLED'
                  )),
  refund_amount integer,                       -- buyer-refunded amount (= line gross)
  seller_note   text,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index returns_order_idx on public.returns (order_id);
create index returns_order_item_idx on public.returns (order_item_id);
create index returns_user_idx on public.returns (user_id);

create trigger returns_updated_at
  before update on public.returns
  for each row execute function public.set_updated_at();

-- Admin-resolved escalation when a buyer disagrees with a seller decision.
create table if not exists public.disputes (
  id            uuid primary key default gen_random_uuid(),
  return_id     uuid not null references public.returns (id) on delete cascade,
  order_id      uuid not null references public.orders (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  seller_id     uuid not null references public.profiles (id),
  reason        text not null,
  status        text not null default 'OPEN'
                  check (status in ('OPEN','APPROVED','REJECTED','CLOSED')),
  resolution    text,
  decided_by    uuid references public.profiles (id),
  decided_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index disputes_return_idx on public.disputes (return_id);
create index disputes_status_idx on public.disputes (status);

create trigger disputes_updated_at
  before update on public.disputes
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.return_reasons enable row level security;
alter table public.shipments enable row level security;
alter table public.returns enable row level security;
alter table public.disputes enable row level security;

create policy "return_reasons_select_all"
  on public.return_reasons for select using (true);
create policy "return_reasons_admin_write"
  on public.return_reasons for all using (
    public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

create policy "shipments_select"
  on public.shipments for select using (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
    or exists (
      select 1 from public.order_items oi
      join public.stores s on s.id = oi.store_id
      where oi.order_id = shipments.order_id and s.owner_id = auth.uid()
    )
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

create policy "returns_select"
  on public.returns for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.order_items oi
      join public.stores s on s.id = oi.store_id
      where oi.id = returns.order_item_id and s.owner_id = auth.uid()
    )
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

create policy "disputes_select"
  on public.disputes for select using (
    user_id = auth.uid()
    or seller_id = auth.uid()
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Sellers may read an order when they own at least one of its lines, so they
-- can fulfil (ship), answer returns, and see line context. Additive to the
-- existing buyer/admin select policy from migration 006.
create policy "orders_select_seller"
  on public.orders for select using (
    exists (
      select 1 from public.order_items oi
      join public.stores s on s.id = oi.store_id
      where oi.order_id = orders.id and s.owner_id = auth.uid()
    )
  );

-- ============================================================
-- Financial functions (security definer)
-- ============================================================

-- Reverse a seller's earned net for an order line once its return is
-- APPROVED: debit the seller wallet, write a REFUND ledger entry, and mark
-- the earning REFUNDED. `refund_amount` on the return stays the buyer's line
-- gross (set at request time); the ledger claw-back is the seller's net.
create or replace function public.refund_line(p_return_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_return record;
  v_earning record;
  v_seller uuid;
begin
  select id, order_item_id, status into v_return
  from public.returns where id = p_return_id for update;
  if v_return is null then
    raise exception 'Return not found' using errcode = 'P0002';
  end if;
  if v_return.status <> 'APPROVED' then
    raise exception 'Return is not approved' using errcode = '23514';
  end if;

  select e.net, e.status, s.owner_id into v_earning.net, v_earning.status, v_seller
  from public.seller_earnings e
  join public.order_items oi on oi.id = e.order_item_id
  join public.stores s on s.id = oi.store_id
  where e.order_item_id = v_return.order_item_id
  for update of e;

  if v_earning.net is null then
    raise exception 'Earning not found for line' using errcode = 'P0002';
  end if;
  if v_earning.status = 'PAID_OUT' then
    raise exception 'Earning already paid out; cannot claw back' using errcode = '23514';
  end if;

  if v_earning.net > 0 then
    perform public.debit_wallet(
      v_seller, v_earning.net, 'REFUND', 'return', p_return_id,
      'Refund pesanan'
    );
  end if;

  update public.seller_earnings
  set status = 'REFUNDED'
  where order_item_id = v_return.order_item_id;

  update public.returns
  set status = 'REFUNDED', reviewed_at = now()
  where id = p_return_id;
end;
$$;

-- Seller marks an order shipped, setting tracking and status SHIPPED.
create or replace function public.ship_order(
  p_order_id uuid,
  p_carrier  text,
  p_tracking text
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_status text;
  v_owns   boolean;
  v_shipment_id uuid;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required' using errcode = '42501';
  end if;

  select status into v_status from public.orders where id = p_order_id;
  if v_status is null then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;
  if v_status not in ('PAID','PROCESSING') then
    raise exception 'Order cannot be shipped in its current status' using errcode = '23514';
  end if;

  select exists (
    select 1 from public.order_items oi
    join public.stores s on s.id = oi.store_id
    where oi.order_id = p_order_id and s.owner_id = v_caller
  ) into v_owns;
  if not v_owns then
    raise exception 'Permission denied: you do not own this order' using errcode = '42501';
  end if;

  insert into public.shipments (order_id, carrier, tracking_number)
  values (p_order_id, p_carrier, p_tracking)
  returning id into v_shipment_id;

  update public.orders set status = 'SHIPPED', updated_at = now()
  where id = p_order_id;

  return v_shipment_id;
end;
$$;

-- Buyer confirms receipt, completing the order.
create or replace function public.confirm_receipt(p_order_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_status text;
  v_buyer  uuid;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required' using errcode = '42501';
  end if;

  select user_id, status into v_buyer, v_status
  from public.orders where id = p_order_id;
  if v_buyer is null then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;
  if v_buyer <> v_caller then
    raise exception 'Permission denied: not your order' using errcode = '42501';
  end if;
  if v_status <> 'SHIPPED' then
    raise exception 'Order is not shipped' using errcode = '23514';
  end if;

  update public.orders set status = 'COMPLETED', updated_at = now()
  where id = p_order_id;
end;
$$;

-- Buyer requests a return for a line of a COMPLETED order within the window.
create or replace function public.request_return(
  p_order_id     uuid,
  p_order_item_id uuid,
  p_reason_id    uuid,
  p_note         text
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_buyer  uuid;
  v_status text;
  v_updated timestamptz;
  v_window int := 30;
  v_owned  boolean;
  v_gross  integer;
  v_return_id uuid;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required' using errcode = '42501';
  end if;

  select (value->>'days')::int into v_window
  from public.settings where key = 'returns.window_days';

  select user_id, status, updated_at into v_buyer, v_status, v_updated
  from public.orders where id = p_order_id;
  if v_buyer is null then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;
  if v_buyer <> v_caller then
    raise exception 'Permission denied: not your order' using errcode = '42501';
  end if;
  if v_status <> 'COMPLETED' then
    raise exception 'Order is not completed' using errcode = '23514';
  end if;
  if coalesce(v_window, 30) > 0 and
     (now() - v_updated) > (coalesce(v_window, 30) || ' days')::interval then
    raise exception 'Return window has passed' using errcode = '23514';
  end if;

  select exists (
    select 1 from public.order_items
    where id = p_order_item_id and order_id = p_order_id
  ) into v_owned;
  if not v_owned then
    raise exception 'Line does not belong to this order' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.returns
    where order_item_id = p_order_item_id
      and status in ('REQUESTED','APPROVED','REFUNDED')
  ) then
    raise exception 'Return already exists for this line' using errcode = '23505';
  end if;

  select product_price * quantity into v_gross
  from public.order_items where id = p_order_item_id;

  insert into public.returns (order_id, order_item_id, user_id, reason_id, note)
  values (p_order_id, p_order_item_id, v_caller, p_reason_id, coalesce(p_note,''))
  returning id into v_return_id;

  update public.returns
  set refund_amount = v_gross
  where id = v_return_id;

  return v_return_id;
end;
$$;

-- Seller accepts or rejects a REQUESTED return. Accepting refunds the line.
create or replace function public.respond_return(
  p_return_id uuid,
  p_approve   boolean,
  p_note      text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_status text;
  v_owner  uuid;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required' using errcode = '42501';
  end if;

  select r.status, s.owner_id into v_status, v_owner
  from public.returns r
  join public.order_items oi on oi.id = r.order_item_id
  join public.stores s on s.id = oi.store_id
  where r.id = p_return_id;
  if v_status is null then
    raise exception 'Return not found' using errcode = 'P0002';
  end if;
  if v_owner <> v_caller then
    raise exception 'Permission denied: not your return' using errcode = '42501';
  end if;
  if v_status <> 'REQUESTED' then
    raise exception 'Return is not awaiting review' using errcode = '23514';
  end if;

  if p_approve then
    update public.returns
    set status = 'APPROVED', seller_note = coalesce(p_note,''), reviewed_at = now()
    where id = p_return_id;
    perform public.refund_line(p_return_id);
  else
    update public.returns
    set status = 'REJECTED', seller_note = coalesce(p_note,''), reviewed_at = now()
    where id = p_return_id;
  end if;
end;
$$;

-- Buyer escalates a REJECTED return to an admin dispute.
create or replace function public.escalate_dispute(
  p_return_id uuid,
  p_reason    text
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_rt     record;
  v_dispute_id uuid;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required' using errcode = '42501';
  end if;

  select r.user_id, r.status, r.order_id, r.order_item_id, s.owner_id
    into v_rt.user_id, v_rt.status, v_rt.order_id, v_rt.order_item_id, v_rt.owner
  from public.returns r
  join public.order_items oi on oi.id = r.order_item_id
  join public.stores s on s.id = oi.store_id
  where r.id = p_return_id;
  if v_rt.user_id is null then
    raise exception 'Return not found' using errcode = 'P0002';
  end if;
  if v_rt.user_id <> v_caller then
    raise exception 'Permission denied: not your return' using errcode = '42501';
  end if;
  if v_rt.status <> 'REJECTED' then
    raise exception 'Only rejected returns can be escalated' using errcode = '23514';
  end if;

  insert into public.disputes (
    return_id, order_id, user_id, seller_id, reason
  )
  values (p_return_id, v_rt.order_id, v_caller, v_rt.owner, coalesce(p_reason,''))
  returning id into v_dispute_id;

  return v_dispute_id;
end;
$$;

-- Admin resolves an OPEN dispute. Approving refunds the line, else closes it.
create or replace function public.resolve_dispute(
  p_dispute_id uuid,
  p_approve    boolean,
  p_note       text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_dispute record;
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin required' using errcode = '42501';
  end if;

  select id, return_id, status into v_dispute
  from public.disputes where id = p_dispute_id for update;
  if v_dispute.status is null then
    raise exception 'Dispute not found' using errcode = 'P0002';
  end if;
  if v_dispute.status <> 'OPEN' then
    raise exception 'Dispute is already resolved' using errcode = '23514';
  end if;

  if p_approve then
    -- Approve the underlying return (from REJECTED) and process the refund.
    update public.returns
    set status = 'APPROVED', reviewed_at = now()
    where id = v_dispute.return_id and status = 'REJECTED';
    perform public.refund_line(v_dispute.return_id);

    update public.disputes
    set status = 'APPROVED', resolution = coalesce(p_note,''),
        decided_by = auth.uid(), decided_at = now()
    where id = p_dispute_id;
  else
    update public.disputes
    set status = 'REJECTED', resolution = coalesce(p_note,''),
        decided_by = auth.uid(), decided_at = now()
    where id = p_dispute_id;
    update public.returns
    set status = 'CANCELLED', seller_note = coalesce(p_note,''),
        reviewed_at = now()
    where id = v_dispute.return_id and status = 'REJECTED';
  end if;
end;
$$;

-- ============================================================
-- END OF MIGRATION: 008_shipping_returns.sql
-- ============================================================

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

-- ============================================================
-- END OF MIGRATION: 009_communication.sql
-- ============================================================

-- ============================================================
-- Warungpedia migration 010 — Promotions
-- ============================================================
-- Adds two promotion mechanisms, both validated and priced on the server:
--
--   • Vouchers   — admin-issued discount codes (percent or fixed amount) with
--     a min-spend, validity window, optional per-user limit, optional total
--     usage cap and an optional percent cap. A buyer applies one code per
--     checkout inside `place_order`, which validates eligibility, computes the
--     discount and records a redemption atomically.
--
--   • Flash sales — admin-scheduled, time-limited per-product discounts whose
--     prices are recomputed from the PRODUCT row inside `place_order`, so the
--     snapshot price is authoritative and never trusted from the client.
--
-- Money stays integer IDR. Percent math always rounds DOWN (floor). Voucher
-- discounts are borne by the marketplace (they reduce `orders.total` but do
-- not change per-line earnings, which are computed from item price snapshots).
--
-- The `orders` table gains `discount` and `voucher_id` so a voucher-applied
-- order can be audited and displayed.

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.vouchers (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique
                      check (code = upper(btrim(code)) and length(code) between 1 and 32),
  description       text,
  discount_type     text not null check (discount_type in ('PERCENT','AMOUNT')),
  discount_value    integer not null check (discount_value > 0),
  min_spend         integer not null default 0 check (min_spend >= 0),
  max_discount      integer check (max_discount is null or max_discount > 0),
  per_user_limit    integer not null default 1 check (per_user_limit >= 0),
  total_usage_limit integer check (total_usage_limit is null or total_usage_limit > 0),
  uses_count        integer not null default 0 check (uses_count >= 0),
  is_active         boolean not null default true,
  starts_at         timestamptz,
  expires_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (
    (discount_type = 'PERCENT' and discount_value <= 100)
    or discount_type = 'AMOUNT'
  )
);

create index vouchers_code_idx on public.vouchers (code);
create index vouchers_active_idx on public.vouchers (is_active, starts_at, expires_at);

create table if not exists public.user_voucher_redemptions (
  id              uuid primary key default gen_random_uuid(),
  voucher_id      uuid not null references public.vouchers (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  order_id        uuid not null references public.orders (id) on delete cascade,
  discount_amount integer not null check (discount_amount >= 0),
  created_at      timestamptz not null default now()
);

create index user_voucher_redemptions_user_idx
  on public.user_voucher_redemptions (user_id, voucher_id);

alter table public.orders
  add column if not exists discount integer not null default 0 check (discount >= 0);
alter table public.orders
  add column if not exists voucher_id uuid references public.vouchers (id);

create index orders_voucher_idx on public.orders (voucher_id);

create table if not exists public.flash_sales (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products (id) on delete cascade,
  discount_type  text not null check (discount_type in ('PERCENT','AMOUNT')),
  discount_value integer not null check (discount_value > 0),
  is_active      boolean not null default true,
  starts_at      timestamptz,
  ends_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (
    (discount_type = 'PERCENT' and discount_value <= 100)
    or discount_type = 'AMOUNT'
  )
);

create index flash_sales_product_idx on public.flash_sales (product_id, is_active, ends_at);

update public.orders set discount = 0, voucher_id = null where discount is null;

alter table public.orders
  alter column discount set not null;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.vouchers enable row level security;
alter table public.user_voucher_redemptions enable row level security;
alter table public.flash_sales enable row level security;

-- Vouchers & redemptions are only read by admins (validation happens inside
-- the definer functions, never by direct client reads).
create policy "vouchers_select_admin"
  on public.vouchers for select using (
    public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

create policy "voucher_redemptions_select_owner"
  on public.user_voucher_redemptions for select using (
    user_id = auth.uid()
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Flash sales are publicly readable in their active window so the storefront
-- can badge sale prices; writes are admin-only.
create policy "flash_sales_select_public"
  on public.flash_sales for select using (true);
create policy "flash_sales_insert_admin"
  on public.flash_sales for insert with check (
    public.current_role() in ('ADMIN','SUPER_ADMIN')
  );
create policy "flash_sales_update_admin"
  on public.flash_sales for update using (
    public.current_role() in ('ADMIN','SUPER_ADMIN')
  );
create policy "flash_sales_delete_admin"
  on public.flash_sales for delete using (
    public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- ============================================================
-- Promotion helpers (security definer)
-- ============================================================

-- The best currently-active flash-sale price for a product, or NULL if the
-- product has no active sale. Matches the client display helper semantically
-- (all pricing math is duplicated here so checkout is authoritative).
create or replace function public.active_flash_price(p_product_id uuid)
returns integer
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_price   integer;
  v_sale    record;
  v_candidate integer;
  v_best    integer;
begin
  select price into v_price from public.products where id = p_product_id;
  if v_price is null then
    return null;
  end if;

  v_best := null;
  for v_sale in
    select discount_type, discount_value
    from public.flash_sales
    where product_id = p_product_id and is_active
      and (starts_at is null or starts_at <= now())
      and (ends_at   is null or ends_at   >  now())
  loop
    if v_sale.discount_type = 'AMOUNT' then
      v_candidate := greatest(v_price - v_sale.discount_value, 0);
    else
      v_candidate := greatest(v_price - floor(v_price * v_sale.discount_value / 100), 0);
    end if;
    if v_best is null or v_candidate < v_best then
      v_best := v_candidate;
    end if;
  end loop;

  return v_best;
end;
$$;

-- Validate a voucher code for a user/subtotal and return the computed discount
-- (0 if no discount eligible, NULL when the code is invalid). Purely a read
-- helper for display; the authoritative application happens in `place_order`.
create or replace function public.validate_voucher(
  p_code     text,
  p_user_id  uuid,
  p_subtotal integer
)
returns table (
  voucher_id uuid,
  discount   integer,
  message    text
)
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v           record;
  v_use_count integer;
  v_redemptions integer;
  v_discount  integer;
begin
  discount := 0;
  message := null;

  select id, discount_type, discount_value, min_spend, max_discount,
         per_user_limit, total_usage_limit, uses_count, is_active,
         starts_at, expires_at
    into v
  from public.vouchers
  where code = upper(btrim(coalesce(p_code, '')));

  if v.id is null then
    message := 'Kode kupon tidak ditemukan.';
    return next;
  end if;

  if not v.is_active then
    message := 'Kupon sudah tidak aktif.';
    return next;
  end if;
  if v.starts_at is not null and v.starts_at > now() then
    message := 'Kupon belum dapat digunakan.';
    return next;
  end if;
  if v.expires_at is not null and v.expires_at <= now() then
    message := 'Kupon sudah kedaluwarsa.';
    return next;
  end if;
  if v.total_usage_limit is not null and v.uses_count >= v.total_usage_limit then
    message := 'Kupon sudah habis digunakan.';
    return next;
  end if;
  if v.per_user_limit > 0 then
    select count(*) into v_redemptions
    from public.user_voucher_redemptions
    where voucher_id = v.id and user_id = p_user_id;
    if v_redemptions >= v.per_user_limit then
      message := 'Anda sudah memakai kupon ini.';
      return next;
    end if;
  end if;
  if p_subtotal < v.min_spend then
    message := 'Belanja belum mencapai minimum kupon.';
    return next;
  end if;

  if v.discount_type = 'AMOUNT' then
    v_discount := least(v.discount_value, p_subtotal);
  else
    v_discount := floor(p_subtotal * v.discount_value / 100);
    if v.max_discount is not null and v_discount > v.max_discount then
      v_discount := v.max_discount;
    end if;
  end if;

  if v_discount >= p_subtotal then
    message := 'Kupon tidak dapat digunakan untuk pesanan ini.';
    return next;
  end if;

  voucher_id := v.id;
  discount := v_discount;
  return next;
end;
$$;

-- ============================================================
-- Admin definers: vouchers
-- ============================================================

create or replace function public.create_voucher(
  p_code              text,
  p_description       text,
  p_discount_type     text,
  p_discount_value    integer,
  p_min_spend         integer default 0,
  p_max_discount      integer default null,
  p_per_user_limit    integer default 1,
  p_total_usage_limit integer default null,
  p_is_active         boolean default true,
  p_starts_at         timestamptz default null,
  p_expires_at        timestamptz default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin required' using errcode = '42501';
  end if;

  insert into public.vouchers (
    code, description, discount_type, discount_value, min_spend, max_discount,
    per_user_limit, total_usage_limit, uses_count, is_active, starts_at, expires_at
  )
  values (
    upper(btrim(p_code)), nullif(btrim(coalesce(p_description,'')),''),
    p_discount_type, p_discount_value, coalesce(p_min_spend,0), p_max_discount,
    coalesce(p_per_user_limit,1), p_total_usage_limit, 0,
    coalesce(p_is_active,true), p_starts_at, p_expires_at
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.update_voucher(
  p_id                uuid,
  p_description       text,
  p_discount_type     text,
  p_discount_value    integer,
  p_min_spend         integer default 0,
  p_max_discount      integer default null,
  p_per_user_limit    integer default 1,
  p_total_usage_limit integer default null,
  p_is_active         boolean default true,
  p_starts_at         timestamptz default null,
  p_expires_at        timestamptz default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin required' using errcode = '42501';
  end if;

  update public.vouchers
  set description        = nullif(btrim(coalesce(p_description,'')),''),
      discount_type      = p_discount_type,
      discount_value     = p_discount_value,
      min_spend          = coalesce(p_min_spend,0),
      max_discount       = p_max_discount,
      per_user_limit     = coalesce(p_per_user_limit,1),
      total_usage_limit  = p_total_usage_limit,
      is_active          = coalesce(p_is_active,true),
      starts_at          = p_starts_at,
      expires_at         = p_expires_at,
      updated_at         = now()
  where id = p_id;
end;
$$;

create or replace function public.set_voucher_active(
  p_id        uuid,
  p_is_active boolean
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin required' using errcode = '42501';
  end if;
  update public.vouchers set is_active = p_is_active, updated_at = now()
  where id = p_id;
end;
$$;

-- ============================================================
-- Admin definers: flash sales
-- ============================================================

create or replace function public.create_flash_sale(
  p_product_id    uuid,
  p_discount_type text,
  p_discount_value integer,
  p_is_active     boolean default true,
  p_starts_at     timestamptz default null,
  p_ends_at       timestamptz default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'Product not found' using errcode = 'P0002';
  end if;

  insert into public.flash_sales (
    product_id, discount_type, discount_value, is_active, starts_at, ends_at
  )
  values (
    p_product_id, p_discount_type, p_discount_value,
    coalesce(p_is_active,true), p_starts_at, p_ends_at
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.update_flash_sale(
  p_id              uuid,
  p_discount_type   text,
  p_discount_value  integer,
  p_is_active       boolean default true,
  p_starts_at       timestamptz default null,
  p_ends_at         timestamptz default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin required' using errcode = '42501';
  end if;
  update public.flash_sales
  set discount_type = p_discount_type,
      discount_value = p_discount_value,
      is_active = coalesce(p_is_active,true),
      starts_at = p_starts_at,
      ends_at = p_ends_at,
      updated_at = now()
  where id = p_id;
end;
$$;

create or replace function public.set_flash_sale_active(
  p_id        uuid,
  p_is_active boolean
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin required' using errcode = '42501';
  end if;
  update public.flash_sales set is_active = p_is_active, updated_at = now()
  where id = p_id;
end;
$$;

-- ============================================================
-- Checkout (replaces migration 006) — flash-sale aware + voucher
-- ============================================================

create or replace function public.place_order(p_voucher_code text default null)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller    uuid := auth.uid();
  v_cart_id   uuid;
  v_product_id uuid;
  v_quantity  integer;
  v_price     integer;
  v_sale_price integer;
  v_weight    integer;
  v_store_id  uuid;
  v_stock     integer;
  v_product_status text;
  v_store_status  text;
  v_name      text;
  v_subtotal  integer := 0;
  v_discount  integer := 0;
  v_voucher_id uuid;
  v_msg       text;
  v_order_id  uuid;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required' using errcode = '42501';
  end if;

  select id into v_cart_id from public.carts where user_id = v_caller;
  if v_cart_id is null then
    raise exception 'Cart is empty' using errcode = 'P0002';
  end if;

  insert into public.orders (user_id, status, subtotal, shipping_fee, discount, total)
  values (v_caller, 'PENDING', 0, 0, 0, 0)
  returning id into v_order_id;

  for v_product_id, v_quantity in
    select product_id, quantity
    from public.cart_items
    where cart_id = v_cart_id
    for update
  loop
    select p.price, p.stock, p.weight_grams, p.store_id, p.name,
           p.status, s.status
      into v_price, v_stock, v_weight, v_store_id, v_name,
           v_product_status, v_store_status
    from public.products p
    join public.stores s on s.id = p.store_id
    where p.id = v_product_id
    for update of p;

    if v_product_status is null
       or v_product_status <> 'ACTIVE'
       or v_store_status <> 'ACTIVE' then
      raise exception 'A product in your cart is no longer available'
        using errcode = 'P0002';
    end if;
    if v_price < 0 then
      raise exception 'A product in your cart has an invalid price'
        using errcode = '23514';
    end if;
    if coalesce(v_stock, 0) < v_quantity then
      raise exception 'Insufficient stock' using errcode = 'P0002';
    end if;

    -- Apply the flash-sale price if one is active (best price wins).
    v_sale_price := public.active_flash_price(v_product_id);
    v_sale_price := coalesce(v_sale_price, v_price);

    update public.products
    set stock = stock - v_quantity, updated_at = now()
    where id = v_product_id;

    insert into public.order_items (
      order_id, store_id, product_id, product_name, product_price,
      quantity, weight_grams
    )
    values (
      v_order_id, v_store_id, v_product_id, v_name, v_sale_price,
      v_quantity, v_weight
    );

    v_subtotal := v_subtotal + (v_sale_price * v_quantity);
  end loop;

  -- Apply an optional voucher discount (validated atomically here).
  if btrim(coalesce(p_voucher_code, '')) <> '' then
    select d.voucher_id, d.discount, d.message
      into v_voucher_id, v_discount, v_msg
    from public.validate_voucher(p_voucher_code, v_caller, v_subtotal) d;

    if v_voucher_id is null then
      raise exception '%', coalesce(v_msg, 'Kupon tidak valid')
        using errcode = 'P0002';
    end if;
    if v_discount > 0 then
      insert into public.user_voucher_redemptions (
        voucher_id, user_id, order_id, discount_amount
      )
      values (v_voucher_id, v_caller, v_order_id, v_discount);

      update public.vouchers
      set uses_count = uses_count + 1, updated_at = now()
      where id = v_voucher_id;
    end if;
  end if;

  update public.orders
  set subtotal = v_subtotal,
      shipping_fee = 0,
      discount = v_discount,
      voucher_id = v_voucher_id,
      total = v_subtotal - v_discount
  where id = v_order_id;

  delete from public.cart_items where cart_id = v_cart_id;
  delete from public.carts where id = v_cart_id;

  return v_order_id;
end;
$$;

-- ============================================================
-- END OF MIGRATION: 010_promotions.sql
-- ============================================================

-- ============================================================
-- Warungpedia migration 011 — Reviews, Wishlist & Social Commerce
-- ============================================================
-- Adds social and engagement features:
--
--   • Product reviews — buyers who received/delivered an order may write one
--     review per product (rating 1–5, optional title, required body). Reviews
--     are verified against order_items + order status to prevent fraud.
--     Denormalized aggregate fields on `products` (reviews_count,
--     rating_avg) and `stores` (rating_avg, rating_count) are kept in sync
--     by triggers.
--
--   • Store following — buyers follow stores to express interest. A toggle
--     definer keeps the PK clean.
--
--   • Wishlists — buyers own one or more named collections; each collection
--     holds products with an optional note. A "default" collection is created
--     on first add.
--
--   • Product views — every product page view is logged (user_id nullable for
--     anon). The log is the recommendation foundation; a helper extracts the
--     most-recently-viewed products for the "recently viewed" shelf.

-- ============================================================
-- Tables
-- ============================================================

-- One review per (user, product); store_id is denormalized for aggregation.
create table if not exists public.product_reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  store_id   uuid not null references public.stores   (id) on delete cascade,
  user_id    uuid not null references public.profiles  (id) on delete cascade,
  order_id   uuid not null references public.orders    (id) on delete cascade,
  author_name text not null,
  rating     integer not null check (rating between 1 and 5),
  title      text check (title is null or length(btrim(title)) between 1 and 120),
  body       text not null check (length(btrim(body)) between 1 and 2000),
  status     text not null default 'ACTIVE'
               check (status in ('ACTIVE','HIDDEN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index product_reviews_product_idx
  on public.product_reviews (product_id, status, created_at desc);
create index product_reviews_store_idx
  on public.product_reviews (store_id, status);
create index product_reviews_user_idx
  on public.product_reviews (user_id, created_at desc);

create trigger product_reviews_updated_at
  before update on public.product_reviews
  for each row execute function public.set_updated_at();

-- Denormalize aggregate onto products so the product page / card can render
-- rating without a separate query.
alter table public.products
  add column if not exists reviews_count integer not null default 0
    check (reviews_count >= 0);
alter table public.products
  add column if not exists rating_avg numeric(3,2) not null default 0
    check (rating_avg >= 0 and rating_avg <= 5);

-- Denormalize aggregate onto stores for the store card / rating badge.
alter table public.stores
  add column if not exists rating_avg   numeric(3,2) not null default 0
    check (rating_avg >= 0 and rating_avg <= 5);
alter table public.stores
  add column if not exists rating_count integer not null default 0
    check (rating_count >= 0);

-- Store following (toggle).
create table if not exists public.store_follows (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  store_id   uuid not null references public.stores   (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, store_id)
);

create index store_follows_store_idx on public.store_follows (store_id);

-- Named wishlist collections per user.
create table if not exists public.wishlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  name       text not null check (length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index wishlists_user_idx on public.wishlists (user_id, created_at);

create trigger wishlists_updated_at
  before update on public.wishlists
  for each row execute function public.set_updated_at();

-- Products inside a wishlist collection.
create table if not exists public.wishlist_items (
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  product_id  uuid not null references public.products  (id) on delete cascade,
  notes       text,
  created_at  timestamptz not null default now(),
  primary key (wishlist_id, product_id)
);

create index wishlist_items_product_idx on public.wishlist_items (product_id);

-- Recommendation foundation: raw view log.
create table if not exists public.product_views (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.profiles (id) on delete set null,
  product_id uuid not null references public.products (id) on delete cascade,
  viewed_at  timestamptz not null default now()
);

create index product_views_product_idx
  on public.product_views (product_id, viewed_at desc);
create index product_views_user_idx
  on public.product_views (user_id, viewed_at desc)
  where user_id is not null;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.product_reviews enable row level security;
alter table public.store_follows    enable row level security;
alter table public.wishlists        enable row level security;
alter table public.wishlist_items   enable row level security;
alter table public.product_views    enable row level security;

-- Reviews: ACTIVE are public; all statuses readable by owner and admins.
create policy "product_reviews_select"
  on public.product_reviews for select using (
    status = 'ACTIVE'
    or user_id = auth.uid()
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );
-- No direct client writes: all mutations go through security-definer RPCs.

-- Store follows: owner can see their follows; admins can see all.
create policy "store_follows_select"
  on public.store_follows for select using (
    user_id = auth.uid()
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Wishlists: owner-only reads.
create policy "wishlists_select"
  on public.wishlists for select using (
    user_id = auth.uid()
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Wishlist items: owner of the owning wishlist.
create policy "wishlist_items_select"
  on public.wishlist_items for select using (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_items.wishlist_id
        and (w.user_id = auth.uid()
             or public.current_role() in ('ADMIN','SUPER_ADMIN'))
    )
  );

-- Product views: insert-only from server; no client reads.
create policy "product_views_insert"
  on public.product_views for insert
  with check (true);

-- ============================================================
-- REVIEW AGGREGATE TRIGGERS
-- ============================================================
-- After insert / update / delete on product_reviews, recalculate the
-- denormalized aggregates on `products` and `stores`.

create or replace function public.sync_review_aggregates()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_product_id uuid;
  v_store_id   uuid;
  v_pid        uuid := coalesce(new.product_id, old.product_id);
  v_sid        uuid := coalesce(new.store_id,   old.store_id);
begin
  -- Recalculate product aggregate.
  update public.products p
  set reviews_count = coalesce(s.cnt, 0),
      rating_avg    = coalesce(s.avg, 0)
  from (
    select count(*)::int cnt, coalesce(round(avg(rating), 2), 0) avg
    from public.product_reviews
    where product_id = v_pid and status = 'ACTIVE'
  ) s
  where p.id = v_pid;

  -- Recalculate store aggregate.
  update public.stores s
  set rating_count = coalesce(a.cnt, 0),
      rating_avg   = coalesce(a.avg, 0)
  from (
    select count(*)::int cnt, coalesce(round(avg(rating), 2), 0) avg
    from public.product_reviews
    where store_id = v_sid and status = 'ACTIVE'
  ) a
  where s.id = v_sid;

  return coalesce(new, old);
end;
$$;

create trigger product_reviews_sync_aggregates
  after insert or update or delete on public.product_reviews
  for each row execute function public.sync_review_aggregates();

-- ============================================================
-- Security-definer RPCs — Reviews
-- ============================================================

-- Verify purchase + uniqueness, then insert.
create or replace function public.create_review(
  p_order_id uuid,
  p_product_id uuid,
  p_rating  integer,
  p_title   text,
  p_body    text
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_store_id uuid;
  v_order    record;
  v_status   text;
  v_author   text;
  v_rating   integer := greatest(1, least(5, p_rating));
  v_title    text    := nullif(btrim(p_title), '');
  v_body     text    := btrim(p_body);
  v_id       uuid;
begin
  if v_uid is null then
    raise exception 'Silakan masuk terlebih dahulu.'
      using errcode = '42501';
  end if;

  if v_body = '' or length(v_body) < 1 or length(v_body) > 2000 then
    raise exception 'Ulasan harus 1–2000 karakter.'
      using errcode = '23514';
  end if;

  -- Snapshot the author's display name (profiles are not publicly readable).
  select coalesce(nullif(btrim(full_name), ''), au.email)
  into v_author
  from public.profiles p
  join auth.users au on au.id = p.id
  where p.id = v_uid;
  if v_author is null or v_author = '' then
    v_author := 'Pembeli';
  end if;

  -- Order must belong to the buyer and be in a reviewable terminal state.
  select o.id, o.status, o.user_id
  into v_order
  from public.orders o
  where o.id = p_order_id;

  if v_order is null then
    raise exception 'Pesanan tidak ditemukan.'
      using errcode = 'P0002';
  end if;
  if v_order.user_id != v_uid then
    raise exception 'Anda bukan pemilik pesanan ini.'
      using errcode = '42501';
  end if;
  if v_order.status not in ('DELIVERED','COMPLETED') then
    raise exception 'Pesanan belum selesai.'
      using errcode = '23514';
  end if;

  -- The product must exist in the order's items.
  select oi.store_id into v_store_id
  from public.order_items oi
  where oi.order_id = p_order_id
    and oi.product_id = p_product_id
  limit 1;

  if v_store_id is null then
    raise exception 'Produk tidak ada di pesanan ini.'
      using errcode = 'P0002';
  end if;

  -- Prevent duplicate review.
  if exists (
    select 1 from public.product_reviews
    where user_id = v_uid and product_id = p_product_id
  ) then
    raise exception 'Anda sudah mengulas produk ini.'
      using errcode = '23505';
  end if;

  insert into public.product_reviews
    (product_id, store_id, user_id, order_id, author_name, rating, title, body)
  values
    (p_product_id, v_store_id, v_uid, p_order_id, v_author, v_rating, v_title, v_body)
  returning id into v_id;

  return v_id;
end;
$$;

-- Owner can update their own review.
create or replace function public.update_review(
  p_review_id uuid,
  p_rating integer,
  p_title  text,
  p_body   text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_rating  integer := greatest(1, least(5, p_rating));
  v_title   text    := nullif(btrim(p_title), '');
  v_body    text    := btrim(p_body);
  v_review  record;
begin
  select * into v_review
  from public.product_reviews
  where id = p_review_id;

  if v_review is null then
    raise exception 'Ulasan tidak ditemukan.'
      using errcode = 'P0002';
  end if;
  if v_review.user_id != v_uid then
    raise exception 'Anda bukan pemilik ulasan ini.'
      using errcode = '42501';
  end if;
  if v_body = '' or length(v_body) < 1 or length(v_body) > 2000 then
    raise exception 'Ulasan harus 1–2000 karakter.'
      using errcode = '23514';
  end if;

  update public.product_reviews
  set rating = v_rating, title = v_title, body = v_body
  where id = p_review_id;
end;
$$;

-- Owner or admin can soft-hide a review.
create or replace function public.set_review_status(
  p_review_id uuid,
  p_status    text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_review record;
  v_role   text;
begin
  select * into v_review
  from public.product_reviews where id = p_review_id;

  if v_review is null then
    raise exception 'Ulasan tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  v_role := public.current_role();

  if v_review.user_id != v_uid
     and v_role not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Tidak diizinkan.'
      using errcode = '42501';
  end if;

  if p_status not in ('ACTIVE','HIDDEN') then
    raise exception 'Status tidak valid.'
      using errcode = '23514';
  end if;

  -- Only admins can set ACTIVE again (un-hide); owners can only hide.
  if p_status = 'ACTIVE' and v_role not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Hanya admin yang dapat memunculkan kembali ulasan.'
      using errcode = '42501';
  end if;

  update public.product_reviews set status = p_status where id = p_review_id;
end;
$$;

-- ============================================================
-- Security-definer RPCs — Store following
-- ============================================================

-- Toggle follow: returns true if now following, false if unfollowed.
create or replace function public.toggle_store_follow(p_store_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_exists boolean;
begin
  if v_uid is null then
    raise exception 'Silakan masuk terlebih dahulu.'
      using errcode = '42501';
  end if;

  if not exists (select 1 from public.stores where id = p_store_id) then
    raise exception 'Toko tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  select exists (
    select 1 from public.store_follows
    where user_id = v_uid and store_id = p_store_id
  ) into v_exists;

  if v_exists then
    delete from public.store_follows
    where user_id = v_uid and store_id = p_store_id;
    return false;
  else
    insert into public.store_follows (user_id, store_id)
    values (v_uid, p_store_id);
    return true;
  end if;
end;
$$;

-- ============================================================
-- Security-definer RPCs — Wishlists
-- ============================================================

-- Create a named collection. Returns the new wishlist id.
create or replace function public.create_wishlist(p_name text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_name text := btrim(p_name);
  v_id   uuid;
begin
  if v_uid is null then
    raise exception 'Silakan masuk terlebih dahulu.'
      using errcode = '42501';
  end if;
  if v_name = '' or length(v_name) > 80 then
    raise exception 'Nama koleksi harus 1–80 karakter.'
      using errcode = '23514';
  end if;

  insert into public.wishlists (user_id, name)
  values (v_uid, v_name)
  returning id into v_id;

  return v_id;
end;
$$;

-- Rename a collection (owner only).
create or replace function public.rename_wishlist(
  p_wishlist_id uuid,
  p_name text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_name text := btrim(p_name);
  v_wl   record;
begin
  select * into v_wl from public.wishlists where id = p_wishlist_id;
  if v_wl is null then
    raise exception 'Koleksi tidak ditemukan.'
      using errcode = 'P0002';
  end if;
  if v_wl.user_id != v_uid then
    raise exception 'Bukan koleksi Anda.'
      using errcode = '42501';
  end if;
  if v_name = '' or length(v_name) > 80 then
    raise exception 'Nama koleksi harus 1–80 karakter.'
      using errcode = '23514';
  end if;

  update public.wishlists set name = v_name where id = p_wishlist_id;
end;
$$;

-- Delete a collection (owner only). Items cascade.
create or replace function public.delete_wishlist(p_wishlist_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_wl  record;
begin
  select * into v_wl from public.wishlists where id = p_wishlist_id;
  if v_wl is null then
    raise exception 'Koleksi tidak ditemukan.'
      using errcode = 'P0002';
  end if;
  if v_wl.user_id != v_uid then
    raise exception 'Bukan koleksi Anda.'
      using errcode = '42501';
  end if;

  delete from public.wishlists where id = p_wishlist_id;
end;
$$;

-- Add a product to a wishlist (or update notes if already present).
-- When no wishlist_id is provided, uses or creates the "Tersimpan" default.
create or replace function public.add_to_wishlist(
  p_product_id  uuid,
  p_wishlist_id uuid default null,
  p_notes       text  default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_wl_id  uuid;
  v_wl     record;
begin
  if v_uid is null then
    raise exception 'Silakan masuk terlebih dahulu.'
      using errcode = '42501';
  end if;

  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'Produk tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  -- Resolve target wishlist.
  v_wl_id := p_wishlist_id;
  if v_wl_id is null then
    select id into v_wl_id
    from public.wishlists
    where user_id = v_uid and name = 'Tersimpan'
    limit 1;

    if v_wl_id is null then
      insert into public.wishlists (user_id, name)
      values (v_uid, 'Tersimpan')
      returning id into v_wl_id;
    end if;
  else
    select * into v_wl from public.wishlists where id = v_wl_id;
    if v_wl is null then
      raise exception 'Koleksi tidak ditemukan.'
        using errcode = 'P0002';
    end if;
    if v_wl.user_id != v_uid then
      raise exception 'Bukan koleksi Anda.'
        using errcode = '42501';
    end if;
  end if;

  insert into public.wishlist_items (wishlist_id, product_id, notes)
  values (v_wl_id, p_product_id, nullif(btrim(p_notes), ''))
  on conflict (wishlist_id, product_id)
  do update set notes = nullif(btrim(p_notes), '');

  return v_wl_id;
end;
$$;

-- Remove a product from a wishlist.
create or replace function public.remove_from_wishlist(
  p_wishlist_id uuid,
  p_product_id  uuid
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_wl  record;
begin
  select * into v_wl from public.wishlists where id = p_wishlist_id;
  if v_wl is null then
    raise exception 'Koleksi tidak ditemukan.'
      using errcode = 'P0002';
  end if;
  if v_wl.user_id != v_uid then
    raise exception 'Bukan koleksi Anda.'
      using errcode = '42501';
  end if;

  delete from public.wishlist_items
  where wishlist_id = p_wishlist_id and product_id = p_product_id;
end;
$$;

-- ============================================================
-- Security-definer RPCs — Product views (recommendation foundation)
-- ============================================================

-- Log a product view. Silently succeeds (best-effort).
create or replace function public.record_product_view(p_product_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  insert into public.product_views (user_id, product_id)
  values (v_uid, p_product_id);
end;
$$;

-- Get recently viewed products for a user (last N distinct product ids).
create or replace function public.get_recently_viewed(p_limit integer default 20)
returns table (product_id uuid, viewed_at timestamptz)
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;
  end if;

  return query
  select distinct on (pv.product_id) pv.product_id, pv.viewed_at
  from public.product_views pv
  where pv.user_id = v_uid
  order by pv.product_id, pv.viewed_at desc
  limit p_limit;
end;
$$;

-- Get related products for a given product (same category, excluding self),
-- sorted by rating and review count. Foundation for future collaborative
-- filtering.
create or replace function public.get_related_products(
  p_product_id uuid,
  p_limit      integer default 12
)
returns table (
  product_id   uuid,
  slug         text,
  name         text,
  price        integer,
  image_url    text,
  reviews_count integer,
  rating_avg   numeric
)
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_cat_id uuid;
begin
  select category_id into v_cat_id
  from public.products where id = p_product_id;

  if v_cat_id is null then
    return;
  end if;

  return query
  select p.id, p.slug, p.name, p.price,
         (p.image_urls)[1],
         p.reviews_count,
         p.rating_avg
  from public.products p
  where p.category_id = v_cat_id
    and p.id != p_product_id
    and p.status = 'ACTIVE'
  order by p.rating_avg desc, p.reviews_count desc, p.created_at desc
  limit p_limit;
end;
$$;

-- ============================================================
-- Indexes on denormalized aggregate columns (for filtering/sorting)
-- ============================================================
create index products_rating_idx
  on public.products (rating_avg desc, reviews_count desc)
  where status = 'ACTIVE';
create index stores_rating_idx
  on public.stores (rating_avg desc, rating_count desc)
  where status = 'ACTIVE';


-- ============================================================
-- END OF MIGRATION: 011_social.sql
-- ============================================================

-- ============================================================
-- 012_admin.sql — Admin dashboard & user administration
-- ============================================================
-- Phase 12 (Admin & CMS).
--
-- Adds the security-definer entry points that enforce business
-- rules which plain RLS cannot express:
--   1. admin_dashboard_stats()  – aggregate KPIs for /admin.
--   2. admin_set_user_role()    – SUPER_ADMIN-only role changes with
--     self-demotion / last-admin protection.
--
-- Categories, products, reviews and settings already carry admin
-- RLS grants (current_role() in ('ADMIN','SUPER_ADMIN')), so the
-- rest of the admin/CMS surface reads & writes those tables directly
-- through application-layer authorization.

-- ------------------------------------------------------------
-- Admin dashboard KPIs
-- ------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns table (
  total_users         bigint,
  total_buyers        bigint,
  total_sellers       bigint,
  total_admins        bigint,
  total_stores        bigint,
  pending_stores      bigint,
  active_stores       bigint,
  total_products      bigint,
  active_products     bigint,
  total_orders        bigint,
  committed_orders    bigint,
  gmv                 bigint,
  pending_withdrawals bigint,
  pending_withdrawals_value bigint,
  open_disputes       bigint,
  pending_returns     bigint,
  hidden_reviews      bigint
)
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin required'
      using errcode = '42501';
  end if;

  select
    count(*),
    count(*) filter (where role = 'BUYER'),
    count(*) filter (where role = 'SELLER'),
    count(*) filter (where role in ('ADMIN','SUPER_ADMIN'))
  into total_users, total_buyers, total_sellers, total_admins
  from public.profiles;

  select
    count(*),
    count(*) filter (where status = 'PENDING'),
    count(*) filter (where status = 'ACTIVE')
  into total_stores, pending_stores, active_stores
  from public.stores;

  select
    count(*),
    count(*) filter (where status = 'ACTIVE')
  into total_products, active_products
  from public.products;

  select
    count(*),
    count(*) filter (where status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')),
    coalesce(sum(total) filter (where status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')), 0)
  into total_orders, committed_orders, gmv
  from public.orders;

  select
    count(*),
    coalesce(sum(amount) filter (where status = 'PENDING'), 0)
  into pending_withdrawals, pending_withdrawals_value
  from public.withdrawals;

  select count(*) into open_disputes
  from public.disputes where status = 'OPEN';

  select count(*) into pending_returns
  from public.returns where status = 'REQUESTED';

  select count(*) into hidden_reviews
  from public.product_reviews where status = 'HIDDEN';

  return next;
end;
$$;

-- ------------------------------------------------------------
-- Admin user listing (with emails from auth.users)
-- ------------------------------------------------------------
-- profiles do not store email (it lives in auth.users, which is not
-- reachable through the anon-keyed client), so list users through a
-- security-definer that joins auth.users by id.
create or replace function public.admin_list_users()
returns table (
  id             uuid,
  email          text,
  full_name      text,
  phone          text,
  role           text,
  email_verified boolean,
  created_at     timestamptz,
  updated_at     timestamptz
)
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin required'
      using errcode = '42501';
  end if;

  return query
  select
    p.id,
    u.email::text as email,
    p.full_name,
    p.phone,
    p.role,
    p.email_verified,
    p.created_at,
    p.updated_at
  from public.profiles p
  left join auth.users u on u.id = p.id
  order by p.created_at asc;
end;
$$;

-- ------------------------------------------------------------
-- Admin user role management (SUPER_ADMIN only)
-- ------------------------------------------------------------
create or replace function public.admin_set_user_role(
  p_user_id uuid,
  p_role    text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_target record;
  v_role   text;
begin
  if public.current_role() not in ('SUPER_ADMIN') then
    raise exception 'Permission denied: super admin required'
      using errcode = '42501';
  end if;

  if p_role not in ('BUYER','SELLER','ADMIN','SUPER_ADMIN') then
    raise exception 'Peran tidak valid.'
      using errcode = '23514';
  end if;

  select * into v_target from public.profiles where id = p_user_id;

  if v_target is null then
    raise exception 'Pengguna tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  -- A super admin may not change their own role.
  if p_user_id = v_uid then
    raise exception 'Anda tidak dapat mengubah peran Anda sendiri.'
      using errcode = '42501';
  end if;

  -- Guard the last SUPER_ADMIN: never demote the final one.
  if v_target.role = 'SUPER_ADMIN'
     and p_role <> 'SUPER_ADMIN'
     and (select count(*) from public.profiles where role = 'SUPER_ADMIN') <= 1
  then
    raise exception 'Tidak dapat menurunkan admin super terakhir.'
      using errcode = '42501';
  end if;

  update public.profiles set role = p_role, updated_at = now()
  where id = p_user_id;
end;
$$;


-- ============================================================
-- END OF MIGRATION: 012_admin.sql
-- ============================================================

-- ============================================================
-- 013_analytics.sql — Analytics (Phase 13)
-- ============================================================
-- Phase 13 (Analytics).
--
-- Analytics aggregates require cross-table joins across orders /
-- order_items / seller_earnings / product_views / products that the
-- RLS-granted tables alone cannot express reliably (e.g. "committed
-- orders" counts, revenue recognized per order, view counts against an
-- insert-only log). Those run as security-definers with an
-- ownership/admin guard. Where a single table suffices, the analytics
-- service reads it directly through RLS.
--
--   1. seller_product_analytics(p_store_id, from, to)
--      – per-product views / orders / units / net revenue (store owner
--        or admin). `product_views` is insert-only under RLS.
--   2. seller_overview(p_store_id, from, to)
--      – store KPI bundle: committed orders, units, net revenue, views,
--        AOV, conversion rate, average rating, review count.
--   3. seller_sales_series(p_store_id, from, to)
--      – zero-filled daily revenue + committed-order series for charts.
--   4. admin_marketplace_analytics(p_from, p_to)
--      – marketplace KPIs (GMV, orders, units, commission, buyers,
--        repeat & new buyers, AOV) for a window.
--
-- All adopt the standard `security definer set search_path = public`
-- + `current_role()` guard pattern from migrations 010–012.

-- ------------------------------------------------------------
-- Store ownership / admin guard (helper)
-- ------------------------------------------------------------
create or replace function public.__analytics_store_guard(p_store_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN')
     and not exists (
       select 1 from public.stores s
       where s.id = p_store_id and s.owner_id = v_uid
     )
  then
    raise exception 'Permission denied: store owner or admin required'
      using errcode = '42501';
  end if;
end;
$$;

-- ------------------------------------------------------------
-- Seller product analytics (owner or admin)
-- ------------------------------------------------------------
create or replace function public.seller_product_analytics(
  p_store_id uuid,
  p_from     timestamptz,
  p_to       timestamptz
)
returns table (
  product_id   uuid,
  product_name text,
  slug         text,
  views        bigint,
  orders_count bigint,
  units_sold   bigint,
  revenue_net  bigint
)
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.__analytics_store_guard(p_store_id);

  return query
  select
    pr.id,
    pr.name,
    pr.slug,
    count(distinct pv.id)                                     as views,
    count(distinct o.id)                                      as orders_count,
    coalesce(sum(oi.quantity), 0)                             as units_sold,
    coalesce(sum(se.net), 0)                                  as revenue_net
  from public.products pr
  left join public.product_views pv
    on pv.product_id = pr.id
   and pv.viewed_at >= p_from and pv.viewed_at < p_to
  left join public.order_items oi
    on oi.product_id = pr.id
  left join public.orders o
    on o.id = oi.order_id
   and o.status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
   and o.created_at >= p_from and o.created_at < p_to
  left join public.seller_earnings se
    on se.order_item_id = oi.id
   and se.store_id = p_store_id
  where pr.store_id = p_store_id
    and (pv.id is not null or oi.id is not null)
  group by pr.id, pr.name, pr.slug
  order by units_sold desc nulls last, views desc nulls last;
end;
$$;

-- ------------------------------------------------------------
-- Seller overview KPIs (owner or admin)
-- ------------------------------------------------------------
create or replace function public.seller_overview(
  p_store_id uuid,
  p_from     timestamptz,
  p_to       timestamptz
)
returns table (
  orders          bigint,
  units           bigint,
  revenue         bigint,
  views           bigint,
  avg_order_value bigint,
  conversion_rate numeric,
  avg_rating      numeric,
  reviews         bigint
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_orders  bigint;
  v_units   bigint;
  v_revenue bigint;
  v_views   bigint;
begin
  perform public.__analytics_store_guard(p_store_id);

  select
    count(distinct o.id),
    coalesce(sum(oi.quantity), 0),
    coalesce(sum(se.net), 0)
  into v_orders, v_units, v_revenue
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  left join public.seller_earnings se
    on se.order_item_id = oi.id and se.store_id = p_store_id
  where oi.store_id = p_store_id
    and o.status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
    and o.created_at >= p_from and o.created_at < p_to;

  select count(distinct pv.id) into v_views
  from public.product_views pv
  join public.products pr on pr.id = pv.product_id
  where pr.store_id = p_store_id
    and pv.viewed_at >= p_from and pv.viewed_at < p_to;

  orders := v_orders;
  units := v_units;
  revenue := v_revenue;
  views := v_views;
  avg_order_value := case when v_orders > 0 then v_revenue / v_orders else 0 end;
  conversion_rate := case
    when v_views > 0 then round((v_orders::numeric / v_views) * 100, 2)
    else 0
  end;

  select
    coalesce(avg(r.rating), 0),
    count(*)
  into avg_rating, reviews
  from public.product_reviews r
  join public.products p on p.id = r.product_id
  where p.store_id = p_store_id
    and r.status = 'ACTIVE'
    and r.created_at >= p_from and r.created_at < p_to;

  return next;
end;
$$;

-- ------------------------------------------------------------
-- Seller daily sales series (owner or admin)
-- ------------------------------------------------------------
create or replace function public.seller_sales_series(
  p_store_id uuid,
  p_from     timestamptz,
  p_to       timestamptz
)
returns table (
  day      date,
  revenue  bigint,
  orders   bigint
)
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.__analytics_store_guard(p_store_id);

  return query
  with daily as (
    select d::date as day
    from generate_series(p_from::date, p_to::date, interval '1 day') d
  ),
  sales as (
    select
      o.created_at::date as day,
      count(distinct o.id) as orders,
      coalesce(sum(se.net), 0) as revenue
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    left join public.seller_earnings se
      on se.order_item_id = oi.id and se.store_id = p_store_id
    where oi.store_id = p_store_id
      and o.status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
      and o.created_at >= p_from and o.created_at < p_to
    group by o.created_at::date
  )
  select
    d.day,
    coalesce(s.revenue, 0),
    coalesce(s.orders, 0)
  from daily d
  left join sales s on s.day = d.day
  order by d.day asc;
end;
$$;

-- ------------------------------------------------------------
-- Seller customer analytics (owner or admin)
-- ------------------------------------------------------------
create or replace function public.seller_customer_analytics(
  p_store_id uuid,
  p_from     timestamptz,
  p_to       timestamptz
)
returns table (
  total_buyers        bigint,
  repeat_buyers       bigint,
  new_buyers          bigint,
  repeat_rate         numeric,
  avg_orders_per_buyer numeric,
  avg_spend           bigint,
  avg_order_value     bigint
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_orders bigint;
  v_spend  bigint;
begin
  perform public.__analytics_store_guard(p_store_id);

  with store_orders as (
    select distinct o.id as order_id, o.user_id, o.total
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.store_id = p_store_id
      and o.status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
      and o.created_at >= p_from and o.created_at < p_to
  ),
  pulls as (
    select user_id, count(*) as order_count
    from store_orders
    group by user_id
  )
  select
    count(*),
    count(*) filter (where order_count > 1),
    coalesce(sum(order_count), 0),
    (select coalesce(sum(total), 0) from store_orders)
  into total_buyers, repeat_buyers, v_orders, v_spend
  from pulls;

  avg_orders_per_buyer := case
    when total_buyers > 0 then round(v_orders::numeric / total_buyers, 2)
    else 0
  end;
  repeat_rate := case
    when total_buyers > 0 then round((repeat_buyers::numeric / total_buyers) * 100, 2)
    else 0
  end;
  avg_spend := case when total_buyers > 0 then v_spend / total_buyers else 0 end;
  avg_order_value := case when v_orders > 0 then v_spend / v_orders else 0 end;

  select count(*) into new_buyers
  from (
    select o.user_id
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.store_id = p_store_id
      and o.status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
    group by o.user_id
    having min(o.created_at) >= p_from and min(o.created_at) < p_to
  ) t;

  return next;
end;
$$;

-- ------------------------------------------------------------
-- Marketplace KPIs (admin only)
-- ------------------------------------------------------------
create or replace function public.admin_marketplace_analytics(
  p_from timestamptz,
  p_to   timestamptz
)
returns table (
  gmv              bigint,
  orders_count     bigint,
  units_sold       bigint,
  commission_total bigint,
  buyers_total     bigint,
  repeat_buyers    bigint,
  new_buyers       bigint,
  avg_order_value  bigint
)
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin required'
      using errcode = '42501';
  end if;

  select
    coalesce(sum(total), 0),
    count(*)
  into gmv, orders_count
  from public.orders
  where status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
    and created_at >= p_from and created_at < p_to;

  select coalesce(sum(oi.quantity), 0) into units_sold
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
    and o.created_at >= p_from and o.created_at < p_to;

  select coalesce(sum(se.commission), 0) into commission_total
  from public.seller_earnings se
  join public.orders o on o.id = se.order_id
  where o.status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
    and o.created_at >= p_from and o.created_at < p_to;

  select
    count(*),
    coalesce(count(*) filter (where total_orders > 1), 0)
  into buyers_total, repeat_buyers
  from (
    select user_id, count(*) as total_orders
    from public.orders
    where status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
      and created_at >= p_from and created_at < p_to
    group by user_id
  ) t;

  select count(*) into new_buyers
  from (
    select user_id
    from public.orders
    where status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
    group by user_id
    having min(created_at) >= p_from and min(created_at) < p_to
  ) t;

  avg_order_value := case
    when orders_count > 0 then gmv / orders_count
    else 0
  end;

  return next;
end;
$$;


-- ============================================================
-- END OF MIGRATION: 013_analytics.sql
-- ============================================================

