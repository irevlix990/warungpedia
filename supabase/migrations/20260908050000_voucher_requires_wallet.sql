-- Migration 20260908050000_voucher_requires_wallet.sql
-- Add wallet-only requirement for vouchers.
-- If requires_wallet = true, the voucher can only be used with WALLET payment.

-- 1. Add column to vouchers table
alter table public.vouchers
  add column if not exists requires_wallet boolean not null default false;

-- 2. Update validate_voucher to include wallet requirement check
-- We accept an optional p_method parameter to validate at checkout.
-- Existing callers without the param still work (default null = no check).
create or replace function public.validate_voucher(
  p_code     text,
  p_user_id  uuid,
  p_subtotal integer,
  p_method   text default null
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
         starts_at, expires_at, requires_wallet
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
    from public.user_voucher_redemptions r
    where r.voucher_id = v.id and r.user_id = p_user_id;
    if v_redemptions >= v.per_user_limit then
      message := 'Anda sudah memakai kupon ini.';
      return next;
    end if;
  end if;
  if p_subtotal < v.min_spend then
    message := 'Belanja belum mencapai minimum kupon.';
    return next;
  end if;

  -- Wallet-only voucher check
  if v.requires_wallet and p_method is not null and p_method <> 'WALLET' then
    message := 'Kupon ini hanya dapat digunakan dengan pembayaran menggunakan Saldo Warungpedia.';
    return next;
    return; -- stop here, don't compute discount
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

-- 3. Update place_order to pass payment_method to validate_voucher
-- place_order receives voucher_code. We need to also receive payment_method
-- to validate wallet-only vouchers. Add optional parameter.
create or replace function public.place_order(
  p_voucher_code text default null,
  p_payment_method text default 'BANK_TRANSFER'
)
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
    from public.validate_voucher(p_voucher_code, v_caller, v_subtotal, p_payment_method) d;

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

-- 4. Update pay_order to reject voucher if method != WALLET
-- This is the final safety check at payment time.
create or replace function public.pay_order(p_order_id uuid, p_method text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller    uuid := auth.uid();
  v_buyer     uuid;
  v_order_status text;
  v_voucher_id uuid;
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

  -- Ensure buyer profile exists
  insert into public.profiles (id, full_name, email_verified)
  select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', ''), u.email_confirmed_at is not null
  from auth.users u
  where u.id = v_caller
  on conflict (id) do nothing;

  select o.user_id, o.status, o.total, o.voucher_id
    into v_buyer, v_order_status, v_gross, v_voucher_id
  from public.orders o where o.id = p_order_id for update;

  if v_buyer is null then
    raise exception 'Pesanan tidak ditemukan' using errcode = 'P0002';
  end if;
  if v_buyer <> v_caller then
    raise exception 'Permission denied: not your order' using errcode = '42501';
  end if;
  if v_order_status <> 'PENDING' then
    raise exception 'Pesanan sudah dibayar atau dibatalkan' using errcode = '23514';
  end if;

  -- Voucher wallet-only enforcement: if order has voucher, method must be WALLET
  if v_voucher_id is not null and p_method <> 'WALLET' then
    raise exception 'Kupon ini hanya dapat digunakan dengan pembayaran menggunakan Saldo Warungpedia.'
      using errcode = '23514';
  end if;

  -- If payment method is WALLET, debit buyer's wallet
  if p_method = 'WALLET' then
    perform public.debit_wallet(
      v_caller, v_gross, 'PAYMENT', 'order', p_order_id,
      'Pembayaran pesanan'
    );
  end if;

  insert into public.payments (order_id, user_id, method, amount, status, paid_at)
  values (p_order_id, v_caller, p_method, v_gross, 'SUCCEEDED', now())
  returning id into v_payment_id;

  update public.orders set status = 'PAID', paid_at = now(), updated_at = now()
  where id = p_order_id;

  -- Recognize earnings in ESCROW (funds held until buyer confirms receipt)
  for v_line in
    select oi.id as order_item_id, oi.store_id, s.owner_id as seller,
           (oi.product_price::bigint * oi.quantity)::integer as line_total
    from public.order_items oi
    join public.stores s on s.id = oi.store_id
    where oi.order_id = p_order_id
  loop
    v_gross := v_line.line_total;
    v_commission := floor(v_gross::bigint * v_bps / 10000)::integer;
    v_net := v_gross - v_commission;

    if v_line.seller is not null then
      -- Ensure seller profile exists
      insert into public.profiles (id, full_name, email_verified)
      select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', ''), u.email_confirmed_at is not null
      from auth.users u
      where u.id = v_line.seller
      on conflict (id) do nothing;

      -- Store earnings in ESCROW (not credited to wallet yet)
      insert into public.seller_earnings (
        order_id, store_id, user_id, order_item_id, gross, commission, net, status
      )
      values (p_order_id, v_line.store_id, v_line.seller, v_line.order_item_id,
              v_gross, v_commission, v_net, 'ESCROW');
    end if;
  end loop;

  return v_payment_id;
end;
$$;

-- 5. Update admin create_voucher/update_voucher to support requires_wallet
create or replace function public.create_voucher(
  p_code              text,
  p_description       text,
  p_discount_type     text,
  p_discount_value    integer,
  p_min_spend         integer,
  p_max_discount      integer,
  p_per_user_limit    integer,
  p_total_usage_limit integer,
  p_is_active         boolean,
  p_starts_at         timestamptz,
  p_expires_at        timestamptz,
  p_requires_wallet   boolean default false
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin only' using errcode = '42501';
  end if;
  insert into public.vouchers (
    code, description, discount_type, discount_value, min_spend,
    max_discount, per_user_limit, total_usage_limit, is_active,
    starts_at, expires_at, requires_wallet
  ) values (
    upper(btrim(p_code)), p_description, p_discount_type, p_discount_value,
    coalesce(p_min_spend, 0), p_max_discount,
    coalesce(p_per_user_limit, 1), p_total_usage_limit,
    coalesce(p_is_active, true), p_starts_at, p_expires_at,
    coalesce(p_requires_wallet, false)
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.update_voucher(
  p_voucher_id        uuid,
  p_code              text,
  p_description       text,
  p_discount_type     text,
  p_discount_value    integer,
  p_min_spend         integer,
  p_max_discount      integer,
  p_per_user_limit    integer,
  p_total_usage_limit integer,
  p_is_active         boolean,
  p_starts_at         timestamptz,
  p_expires_at        timestamptz,
  p_requires_wallet   boolean default false
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin only' using errcode = '42501';
  end if;
  update public.vouchers set
    code = upper(btrim(p_code)),
    description = p_description,
    discount_type = p_discount_type,
    discount_value = p_discount_value,
    min_spend = coalesce(p_min_spend, 0),
    max_discount = p_max_discount,
    per_user_limit = coalesce(p_per_user_limit, 1),
    total_usage_limit = p_total_usage_limit,
    is_active = coalesce(p_is_active, true),
    starts_at = p_starts_at,
    expires_at = p_expires_at,
    requires_wallet = coalesce(p_requires_wallet, false),
    updated_at = now()
  where id = p_voucher_id;
end;
$$;
