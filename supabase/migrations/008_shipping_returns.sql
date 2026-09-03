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