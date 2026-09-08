-- Migration 20260908040000_admin_verify_bank_transfer.sql
-- Admin function to verify a bank-transfer payment and mark order as PAID.
-- This mirrors pay_order logic but is admin-scoped (no buyer check).

create or replace function public.admin_verify_bank_transfer(p_order_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller    uuid := auth.uid();
  v_role      text;
  v_user_id   uuid;
  v_status    text;
  v_method    text;
  v_total     integer;
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

  -- Check admin / super_admin
  select role into v_role from public.profiles where id = v_caller;
  if v_role not in ('ADMIN', 'SUPER_ADMIN') then
    raise exception 'Permission denied: admin only'
      using errcode = '42501';
  end if;

  select o.user_id, o.status, o.payment_method, o.total
    into v_user_id, v_status, v_method, v_total
  from public.orders o where o.id = p_order_id for update;

  if v_user_id is null then
    raise exception 'Pesanan tidak ditemukan' using errcode = 'P0002';
  end if;
  if v_status <> 'PENDING' then
    raise exception 'Pesanan sudah diproses atau dibatalkan' using errcode = '23514';
  end if;
  if v_method <> 'BANK_TRANSFER' then
    raise exception 'Metode pembayaran bukan transfer bank' using errcode = '23514';
  end if;

  -- Create payment record
  insert into public.payments (order_id, user_id, method, amount, status, paid_at)
  values (p_order_id, v_user_id, 'BANK_TRANSFER', v_total, 'SUCCEEDED', now())
  returning id into v_payment_id;

  -- Mark order as PAID
  update public.orders
    set status = 'PAID', paid_at = now(), updated_at = now()
  where id = p_order_id;

  -- Recognize earnings in ESCROW
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
      insert into public.profiles (id, full_name, email_verified)
      select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', ''), u.email_confirmed_at is not null
      from auth.users u
      where u.id = v_line.seller
      on conflict (id) do nothing;

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

-- Grant execute to authenticated (RLS + role check inside function handles security)
grant execute on function public.admin_verify_bank_transfer(uuid) to authenticated;
