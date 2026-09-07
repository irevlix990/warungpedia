-- Migration 20260907030000_force_fix_product_analytics.sql
-- Force-replace seller_product_analytics with correct date-filtered aggregation.

CREATE OR REPLACE FUNCTION public.seller_product_analytics(
  p_store_id uuid,
  p_from     timestamptz,
  p_to       timestamptz
)
RETURNS TABLE (
  product_id   uuid,
  product_name text,
  slug         text,
  views        bigint,
  orders_count bigint,
  units_sold   bigint,
  revenue_net  bigint
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public.__analytics_store_guard(p_store_id);

  RETURN QUERY
  WITH product_views_agg AS (
    SELECT
      pv.product_id,
      count(DISTINCT pv.id) AS views
    FROM public.product_views pv
    WHERE pv.viewed_at >= p_from AND pv.viewed_at < p_to
    GROUP BY pv.product_id
  ),
  product_orders_agg AS (
    SELECT
      oi.product_id,
      count(DISTINCT o.id)  AS orders_count,
      sum(oi.quantity)      AS units_sold,
      sum(se.net)           AS revenue_net
    FROM public.order_items oi
    JOIN public.orders o
      ON o.id = oi.order_id
     AND o.status IN ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
     AND o.created_at >= p_from AND o.created_at < p_to
    LEFT JOIN public.seller_earnings se
      ON se.order_item_id = oi.id
     AND se.store_id = p_store_id
    WHERE oi.store_id = p_store_id
    GROUP BY oi.product_id
  )
  SELECT
    pr.id,
    pr.name,
    pr.slug,
    coalesce(pva.views, 0)            AS views,
    coalesce(poa.orders_count, 0)     AS orders_count,
    coalesce(poa.units_sold, 0)       AS units_sold,
    coalesce(poa.revenue_net, 0)      AS revenue_net
  FROM public.products pr
  LEFT JOIN product_views_agg pva ON pva.product_id = pr.id
  LEFT JOIN product_orders_agg poa ON poa.product_id = pr.id
  WHERE pr.store_id = p_store_id
    AND (pva.views > 0 OR poa.orders_count > 0)
  ORDER BY poa.units_sold DESC NULLS LAST, pva.views DESC NULLS LAST;
END;
$$;
