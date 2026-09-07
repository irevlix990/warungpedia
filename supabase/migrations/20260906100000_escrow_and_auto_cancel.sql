-- Migration 20260906100000_escrow_and_auto_cancel.sql
-- Implement escrow system: funds held until buyer confirms receipt.
-- Add auto-cancel: seller must confirm within 2x24h, then ship within 1x24h.

-- 1. Add timestamps to track order lifecycle
alter table public.orders
  add column if not exists paid_at timestamptz,
  add column if not exists processing_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz;

-- 2. Update seller_earnings to add ESCROW status (funds held until buyer confirms)
alter table public.seller_earnings
  drop constraint if exists seller_earnings_status_check;
alter table public.seller_earnings
  add constraint seller_earnings_status_check
  check (status in ('ESCROW','AVAILABLE','PAID_OUT','REFUNDED'));

-- 3. Modify pay_order to set earnings status to ESCROW instead of AVAILABLE
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

  -- Ensure buyer profile exists
  insert into public.profiles (id, full_name, email_verified)
  select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', ''), u.email_confirmed_at is not null
  from auth.users u
  where u.id = v_caller
  on conflict (id) do nothing;

  select o.user_id, o.status, o.total
    into v_buyer, v_order_status, v_gross
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

-- 4. Add process_order function (seller confirms they will fulfill the order)
create or replace function public.process_order(p_order_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_status text;
  v_owns   boolean;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required' using errcode = '42501';
  end if;

  select status into v_status from public.orders where id = p_order_id for update;
  if v_status is null then
    raise exception 'Pesanan tidak ditemukan' using errcode = 'P0002';
  end if;
  if v_status <> 'PAID' then
    raise exception 'Pesanan tidak dapat diproses dalam status ini' using errcode = '23514';
  end if;

  -- Check ownership (seller owns at least one item in the order)
  select exists (
    select 1 from public.order_items oi
    join public.stores s on s.id = oi.store_id
    where oi.order_id = p_order_id and s.owner_id = v_caller
  ) into v_owns;
  if not v_owns then
    raise exception 'Permission denied: you do not own this order' using errcode = '42501';
  end if;

  update public.orders set status = 'PROCESSING', processing_at = now(), updated_at = now()
  where id = p_order_id;
end;
$$;

-- 5. Update ship_order to track shipped_at timestamp
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
    raise exception 'Pesanan tidak ditemukan' using errcode = 'P0002';
  end if;
  if v_status not in ('PAID','PROCESSING') then
    raise exception 'Pesanan tidak dapat dikirim dalam status ini' using errcode = '23514';
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

  update public.orders set status = 'SHIPPED', shipped_at = now(), updated_at = now()
  where id = p_order_id;

  return v_shipment_id;
end;
$$;

-- 6. Update confirm_receipt to release escrow funds to seller wallet
create or replace function public.confirm_receipt(p_order_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_status text;
  v_buyer  uuid;
  v_earning record;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required' using errcode = '42501';
  end if;

  select user_id, status into v_buyer, v_status
  from public.orders where id = p_order_id for update;
  if v_buyer is null then
    raise exception 'Pesanan tidak ditemukan' using errcode = 'P0002';
  end if;
  if v_buyer <> v_caller then
    raise exception 'Permission denied: not your order' using errcode = '42501';
  end if;
  if v_status <> 'SHIPPED' then
    raise exception 'Pesanan belum dikirim' using errcode = '23514';
  end if;

  -- Release escrow funds to seller wallets
  for v_earning in
    select user_id, net, order_item_id
    from public.seller_earnings
    where order_id = p_order_id and status = 'ESCROW'
  loop
    if v_earning.net > 0 then
      perform public.credit_wallet(
        v_earning.user_id, v_earning.net, 'SALE', 'order', p_order_id,
        'Penjualan pesanan'
      );
    end if;
  end loop;

  -- Mark earnings as AVAILABLE (released from escrow)
  update public.seller_earnings
  set status = 'AVAILABLE'
  where order_id = p_order_id and status = 'ESCROW';

  update public.orders set status = 'COMPLETED', completed_at = now(), updated_at = now()
  where id = p_order_id;
end;
$$;

-- 7. Add cancel_order function (refunds buyer, reverts stock, marks earnings as REFUNDED)
create or replace function public.cancel_order(p_order_id uuid, p_reason text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_status text;
  v_buyer  uuid;
  v_total  integer;
  v_payment record;
  v_item   record;
begin
  if v_caller is null then
    raise exception 'Permission denied: sign in required' using errcode = '42501';
  end if;

  select user_id, status, total into v_buyer, v_status, v_total
  from public.orders where id = p_order_id for update;

  if v_buyer is null then
    raise exception 'Pesanan tidak ditemukan' using errcode = 'P0002';
  end if;

  -- Only PAID or PROCESSING orders can be cancelled
  if v_status not in ('PAID','PROCESSING') then
    raise exception 'Pesanan tidak dapat dibatalkan dalam status ini' using errcode = '23514';
  end if;

  -- Restore stock for all order items
  for v_item in
    select product_id, quantity
    from public.order_items
    where order_id = p_order_id and product_id is not null
  loop
    update public.products
    set stock = stock + v_item.quantity, updated_at = now()
    where id = v_item.product_id;
  end loop;

  -- Refund buyer if payment was WALLET
  select method, amount into v_payment
  from public.payments
  where order_id = p_order_id and status = 'SUCCEEDED'
  limit 1;

  if v_payment.method = 'WALLET' and v_payment.amount > 0 then
    perform public.credit_wallet(
      v_buyer, v_payment.amount, 'REFUND', 'order', p_order_id,
      'Pengembalian dana: ' || p_reason
    );
  end if;

  -- Mark seller earnings as REFUNDED (never released from escrow)
  update public.seller_earnings
  set status = 'REFUNDED'
  where order_id = p_order_id and status = 'ESCROW';

  update public.orders
  set status = 'CANCELLED', cancelled_at = now(), updated_at = now()
  where id = p_order_id;
end;
$$;

-- 8. Add auto_cancel_expired_orders function (called by cron/edge function)
create or replace function public.auto_cancel_expired_orders()
returns table(order_id uuid, reason text)
language plpgsql
security definer set search_path = public
as $$
declare
  v_order record;
begin
  -- Cancel orders that are PAID for >2x24h without seller processing
  for v_order in
    select id, paid_at
    from public.orders
    where status = 'PAID'
      and paid_at is not null
      and paid_at < now() - interval '48 hours'
    for update skip locked
  loop
    perform public.cancel_order(
      v_order.id,
      'Penjual tidak memproses pesanan dalam 2x24 jam'
    );
    order_id := v_order.id;
    reason := 'Seller did not process within 48h';
    return next;
  end loop;

  -- Cancel orders that are PROCESSING for >1x24h without shipping
  for v_order in
    select id, processing_at
    from public.orders
    where status = 'PROCESSING'
      and processing_at is not null
      and processing_at < now() - interval '24 hours'
    for update skip locked
  loop
    perform public.cancel_order(
      v_order.id,
      'Penjual tidak mengirim pesanan dalam 1x24 jam'
    );
    order_id := v_order.id;
    reason := 'Seller did not ship within 24h';
    return next;
  end loop;
end;
$$;

-- 9. Grant execute permissions
grant execute on function public.process_order(uuid) to authenticated;
grant execute on function public.cancel_order(uuid, text) to authenticated;
grant execute on function public.auto_cancel_expired_orders() to service_role;
