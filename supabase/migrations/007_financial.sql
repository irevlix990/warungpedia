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
