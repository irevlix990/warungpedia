-- Fix circular RLS recursion between orders ↔ order_items
--
-- Problem:
--   orders_select_seller queries order_items
--   order_items_select_user queries orders  →  infinite recursion!
--
-- Solution:
--   1. Add is_order_owner() security-definer helper (bypasses RLS on orders).
--   2. Rewrite order_items_select_user to use the helper instead of a direct
--      subquery on orders, breaking the cycle.

-- Helper: checks if the current user owns the given order.
-- security definer → queries orders without triggering RLS policies.
create or replace function public.is_order_owner(p_order_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.orders
    where id = p_order_id and user_id = auth.uid()
  );
$$;

-- Recreate the order_items SELECT policy using the helper.
drop policy if exists "order_items_select_user" on public.order_items;

create policy "order_items_select_user"
  on public.order_items for select using (
    public.is_order_owner(order_id)
    or exists (select 1 from public.stores
               where id = store_id and owner_id = auth.uid())
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );
