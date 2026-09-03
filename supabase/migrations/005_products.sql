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