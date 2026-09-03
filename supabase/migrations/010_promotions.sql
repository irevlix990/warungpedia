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