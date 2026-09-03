-- ============================================================
-- 013_analytics.sql — Analytics (Phase 13)
-- ============================================================
-- Phase 13 (Analytics).
--
-- Analytics aggregates require cross-table joins across orders /
-- order_items / seller_earnings / product_views / products that the
-- RLS-granted tables alone cannot express reliably (e.g. "committed
-- orders" counts, revenue recognized per order, view counts against an
-- insert-only log). Those run as security-definers with an
-- ownership/admin guard. Where a single table suffices, the analytics
-- service reads it directly through RLS.
--
--   1. seller_product_analytics(p_store_id, from, to)
--      – per-product views / orders / units / net revenue (store owner
--        or admin). `product_views` is insert-only under RLS.
--   2. seller_overview(p_store_id, from, to)
--      – store KPI bundle: committed orders, units, net revenue, views,
--        AOV, conversion rate, average rating, review count.
--   3. seller_sales_series(p_store_id, from, to)
--      – zero-filled daily revenue + committed-order series for charts.
--   4. admin_marketplace_analytics(p_from, p_to)
--      – marketplace KPIs (GMV, orders, units, commission, buyers,
--        repeat & new buyers, AOV) for a window.
--
-- All adopt the standard `security definer set search_path = public`
-- + `current_role()` guard pattern from migrations 010–012.

-- ------------------------------------------------------------
-- Store ownership / admin guard (helper)
-- ------------------------------------------------------------
create or replace function public.__analytics_store_guard(p_store_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN')
     and not exists (
       select 1 from public.stores s
       where s.id = p_store_id and s.owner_id = v_uid
     )
  then
    raise exception 'Permission denied: store owner or admin required'
      using errcode = '42501';
  end if;
end;
$$;

-- ------------------------------------------------------------
-- Seller product analytics (owner or admin)
-- ------------------------------------------------------------
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
    count(distinct pv.id)                                     as views,
    count(distinct o.id)                                      as orders_count,
    coalesce(sum(oi.quantity), 0)                             as units_sold,
    coalesce(sum(se.net), 0)                                  as revenue_net
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

-- ------------------------------------------------------------
-- Seller overview KPIs (owner or admin)
-- ------------------------------------------------------------
create or replace function public.seller_overview(
  p_store_id uuid,
  p_from     timestamptz,
  p_to       timestamptz
)
returns table (
  orders          bigint,
  units           bigint,
  revenue         bigint,
  views           bigint,
  avg_order_value bigint,
  conversion_rate numeric,
  avg_rating      numeric,
  reviews         bigint
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_orders  bigint;
  v_units   bigint;
  v_revenue bigint;
  v_views   bigint;
begin
  perform public.__analytics_store_guard(p_store_id);

  select
    count(distinct o.id),
    coalesce(sum(oi.quantity), 0),
    coalesce(sum(se.net), 0)
  into v_orders, v_units, v_revenue
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  left join public.seller_earnings se
    on se.order_item_id = oi.id and se.store_id = p_store_id
  where oi.store_id = p_store_id
    and o.status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
    and o.created_at >= p_from and o.created_at < p_to;

  select count(distinct pv.id) into v_views
  from public.product_views pv
  join public.products pr on pr.id = pv.product_id
  where pr.store_id = p_store_id
    and pv.viewed_at >= p_from and pv.viewed_at < p_to;

  orders := v_orders;
  units := v_units;
  revenue := v_revenue;
  views := v_views;
  avg_order_value := case when v_orders > 0 then v_revenue / v_orders else 0 end;
  conversion_rate := case
    when v_views > 0 then round((v_orders::numeric / v_views) * 100, 2)
    else 0
  end;

  select
    coalesce(avg(r.rating), 0),
    count(*)
  into avg_rating, reviews
  from public.product_reviews r
  join public.products p on p.id = r.product_id
  where p.store_id = p_store_id
    and r.status = 'ACTIVE'
    and r.created_at >= p_from and r.created_at < p_to;

  return next;
end;
$$;

-- ------------------------------------------------------------
-- Seller daily sales series (owner or admin)
-- ------------------------------------------------------------
create or replace function public.seller_sales_series(
  p_store_id uuid,
  p_from     timestamptz,
  p_to       timestamptz
)
returns table (
  day      date,
  revenue  bigint,
  orders   bigint
)
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.__analytics_store_guard(p_store_id);

  return query
  with daily as (
    select d::date as day
    from generate_series(p_from::date, p_to::date, interval '1 day') d
  ),
  sales as (
    select
      o.created_at::date as day,
      count(distinct o.id) as orders,
      coalesce(sum(se.net), 0) as revenue
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    left join public.seller_earnings se
      on se.order_item_id = oi.id and se.store_id = p_store_id
    where oi.store_id = p_store_id
      and o.status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
      and o.created_at >= p_from and o.created_at < p_to
    group by o.created_at::date
  )
  select
    d.day,
    coalesce(s.revenue, 0),
    coalesce(s.orders, 0)
  from daily d
  left join sales s on s.day = d.day
  order by d.day asc;
end;
$$;

-- ------------------------------------------------------------
-- Seller customer analytics (owner or admin)
-- ------------------------------------------------------------
create or replace function public.seller_customer_analytics(
  p_store_id uuid,
  p_from     timestamptz,
  p_to       timestamptz
)
returns table (
  total_buyers        bigint,
  repeat_buyers       bigint,
  new_buyers          bigint,
  repeat_rate         numeric,
  avg_orders_per_buyer numeric,
  avg_spend           bigint,
  avg_order_value     bigint
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_orders bigint;
  v_spend  bigint;
begin
  perform public.__analytics_store_guard(p_store_id);

  with store_orders as (
    select distinct o.id as order_id, o.user_id, o.total
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.store_id = p_store_id
      and o.status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
      and o.created_at >= p_from and o.created_at < p_to
  ),
  pulls as (
    select user_id, count(*) as order_count
    from store_orders
    group by user_id
  )
  select
    count(*),
    count(*) filter (where order_count > 1),
    coalesce(sum(order_count), 0),
    (select coalesce(sum(total), 0) from store_orders)
  into total_buyers, repeat_buyers, v_orders, v_spend
  from pulls;

  avg_orders_per_buyer := case
    when total_buyers > 0 then round(v_orders::numeric / total_buyers, 2)
    else 0
  end;
  repeat_rate := case
    when total_buyers > 0 then round((repeat_buyers::numeric / total_buyers) * 100, 2)
    else 0
  end;
  avg_spend := case when total_buyers > 0 then v_spend / total_buyers else 0 end;
  avg_order_value := case when v_orders > 0 then v_spend / v_orders else 0 end;

  select count(*) into new_buyers
  from (
    select o.user_id
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.store_id = p_store_id
      and o.status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
    group by o.user_id
    having min(o.created_at) >= p_from and min(o.created_at) < p_to
  ) t;

  return next;
end;
$$;

-- ------------------------------------------------------------
-- Marketplace KPIs (admin only)
-- ------------------------------------------------------------
create or replace function public.admin_marketplace_analytics(
  p_from timestamptz,
  p_to   timestamptz
)
returns table (
  gmv              bigint,
  orders_count     bigint,
  units_sold       bigint,
  commission_total bigint,
  buyers_total     bigint,
  repeat_buyers    bigint,
  new_buyers       bigint,
  avg_order_value  bigint
)
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin required'
      using errcode = '42501';
  end if;

  select
    coalesce(sum(total), 0),
    count(*)
  into gmv, orders_count
  from public.orders
  where status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
    and created_at >= p_from and created_at < p_to;

  select coalesce(sum(oi.quantity), 0) into units_sold
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
    and o.created_at >= p_from and o.created_at < p_to;

  select coalesce(sum(se.commission), 0) into commission_total
  from public.seller_earnings se
  join public.orders o on o.id = se.order_id
  where o.status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
    and o.created_at >= p_from and o.created_at < p_to;

  select
    count(*),
    coalesce(count(*) filter (where total_orders > 1), 0)
  into buyers_total, repeat_buyers
  from (
    select user_id, count(*) as total_orders
    from public.orders
    where status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
      and created_at >= p_from and created_at < p_to
    group by user_id
  ) t;

  select count(*) into new_buyers
  from (
    select user_id
    from public.orders
    where status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
    group by user_id
    having min(created_at) >= p_from and min(created_at) < p_to
  ) t;

  avg_order_value := case
    when orders_count > 0 then gmv / orders_count
    else 0
  end;

  return next;
end;
$$;
