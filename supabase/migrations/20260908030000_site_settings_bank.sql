-- Site settings table for admin-configurable bank details
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- Only admins can read/write site settings
create policy "site_settings_admin_select"
  on public.site_settings for select
  using (public.current_role() in ('ADMIN','SUPER_ADMIN'));

create policy "site_settings_admin_insert"
  on public.site_settings for insert
  with check (public.current_role() in ('ADMIN','SUPER_ADMIN'));

create policy "site_settings_admin_update"
  on public.site_settings for update
  using (public.current_role() in ('ADMIN','SUPER_ADMIN'));

-- Seed the default payment bank settings
insert into public.site_settings (key, value) values
  ('payment_bank', '{
    "bank_name": "Bank BCA",
    "account_number": "1234567890",
    "account_name": "PT Warungpedia Indonesia",
    "payment_deadline_hours": 24
  }'::jsonb)
on conflict (key) do nothing;

-- Add payment_method and payment_deadline to orders
alter table public.orders
  add column if not exists payment_method text not null default 'BANK_TRANSFER',
  add column if not exists payment_deadline timestamptz;

-- RPC: get payment bank settings (public, for buyers)
create or replace function public.get_payment_bank_settings()
returns jsonb
language sql
stable
security definer set search_path = public
as $$
  select coalesce(value, '{}'::jsonb)
  from public.site_settings
  where key = 'payment_bank';
$$;

grant execute on function public.get_payment_bank_settings() to authenticated, anon;

-- RPC: admin update payment bank settings
create or replace function public.update_payment_bank_settings(
  p_bank_name text,
  p_account_number text,
  p_account_name text,
  p_payment_deadline_hours integer default 24
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin only' using errcode = '42501';
  end if;

  insert into public.site_settings (key, value, updated_at)
  values ('payment_bank', jsonb_build_object(
    'bank_name', p_bank_name,
    'account_number', p_account_number,
    'account_name', p_account_name,
    'payment_deadline_hours', p_payment_deadline_hours
  ), now())
  on conflict (key) do update
    set value = jsonb_build_object(
      'bank_name', p_bank_name,
      'account_number', p_account_number,
      'account_name', p_account_name,
      'payment_deadline_hours', p_payment_deadline_hours
    ),
    updated_at = now();
end;
$$;

grant execute on function public.update_payment_bank_settings(text,text,text,integer) to authenticated;
