-- Migration 20260906080000_fix_financial_rpcs.sql
-- Fix financial RPCs: profiles fallback, ensure_wallet robustness, pay_order wallet debiting.

-- 1. Robust ensure_wallet helper
create or replace function public.ensure_wallet(p_user_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_wallet_id uuid;
begin
  if p_user_id is null then
    raise exception 'User ID cannot be null' using errcode = '23514';
  end if;

  -- Ensure profile row exists to prevent foreign key violation on wallets/ledger
  insert into public.profiles (id, full_name, email_verified)
  select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', ''), u.email_confirmed_at is not null
  from auth.users u
  where u.id = p_user_id
  on conflict (id) do nothing;

  select id into v_wallet_id from public.wallets where user_id = p_user_id;
  if v_wallet_id is null then
    insert into public.wallets (user_id) values (p_user_id)
    on conflict (user_id) do nothing
    returning id into v_wallet_id;

    if v_wallet_id is null then
      select id into v_wallet_id from public.wallets where user_id = p_user_id;
    end if;
  end if;
  return v_wallet_id;
end;
$$;

-- 2. Enhanced pay_order function
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

    if v_line.seller is not null then
      -- Ensure seller profile exists
      insert into public.profiles (id, full_name, email_verified)
      select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', ''), u.email_confirmed_at is not null
      from auth.users u
      where u.id = v_line.seller
      on conflict (id) do nothing;

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
    end if;
  end loop;

  return v_payment_id;
end;
$$;
