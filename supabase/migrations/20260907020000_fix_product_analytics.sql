-- Migration 20260907020000_fix_product_analytics.sql
-- Fix: seller_product_analytics was counting ALL units_sold and revenue_net
-- regardless of date range because order_items had no date filter.
-- Only views and orders_count were correctly filtered.

create or replace function public.seller_product_analytics(
  p_store_id uuid,
  p_from     timestamptz,
  p_to       timestamptz
)
returns table (
  product_id   uuid,
  product_name text,
  slug         text,
  views        bigint,
  orders_count bigint,
  units_sold   bigint,
  revenue_net  bigint
)
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.__analytics_store_guard(p_store_id);

  return query
  select
    pr.id,
    pr.name,
    pr.slug,
    count(distinct pv.id)                                                  as views,
    count(distinct o.id)                                                   as orders_count,
    coalesce(sum(case when o.id is not null then oi.quantity else 0 end), 0) as units_sold,
    coalesce(sum(case when se.id is not null then se.net else 0 end), 0)     as revenue_net
  from public.products pr
  left join public.product_views pv
    on pv.product_id = pr.id
   and pv.viewed_at >= p_from and pv.viewed_at < p_to
  left join public.order_items oi
    on oi.product_id = pr.id
  left join public.orders o
    on o.id = oi.order_id
   and o.status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
   and o.created_at >= p_from and o.created_at < p_to
  left join public.seller_earnings se
    on se.order_item_id = oi.id
   and se.store_id = p_store_id
  where pr.store_id = p_store_id
    and (pv.id is not null or oi.id is not null)
  group by pr.id, pr.name, pr.slug
  order by units_sold desc nulls last, views desc nulls last;
end;
$$;
