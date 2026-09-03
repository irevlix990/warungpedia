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
