-- Migration 20260908060000_badges.sql
-- Add seller badge and buyer badge columns.

-- 1. Seller badge on stores table
alter table public.stores
  add column if not exists badge text
    check (badge is null or badge in ('OFFICIAL','MALL','STAR'));

-- 2. Buyer badge on profiles table
alter table public.profiles
  add column if not exists buyer_badge text
    check (buyer_badge is null or buyer_badge in ('VIP','PLATINUM','GOLD','SILVER','BRONZE'));

-- 3. RPC: admin update store badge
create or replace function public.update_store_badge(
  p_store_id uuid,
  p_badge text
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin only' using errcode = '42501';
  end if;
  update public.stores set badge = nullif(p_badge, ''), updated_at = now()
  where id = p_store_id;
end;
$$;

grant execute on function public.update_store_badge(uuid, text) to authenticated;

-- 4. RPC: admin update buyer badge
create or replace function public.update_buyer_badge(
  p_user_id uuid,
  p_badge text
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin only' using errcode = '42501';
  end if;
  update public.profiles set buyer_badge = nullif(p_badge, ''), updated_at = now()
  where id = p_user_id;
end;
$$;

grant execute on function public.update_buyer_badge(uuid, text) to authenticated;
