-- ============================================================
-- Warungpedia demo promotions
-- ============================================================
-- Development/demo data only (see supabase/seed/README.md). Idempotent:
-- safe to run repeatedly.
--
-- Provides a couple of example vouchers for manual testing and, when any
-- product exists, an active flash sale so the storefront badge is visible.
-- Flash-sale seeding is conditional so a fresh DB with no demo products
-- does not fail.

insert into public.vouchers (
  code, description, discount_type, discount_value, min_spend,
  max_discount, per_user_limit, total_usage_limit, uses_count, is_active,
  starts_at, expires_at
)
values
  (
    'HEMAT10', 'Diskon 10% min. belanja Rp150.000', 'PERCENT', 10, 150000,
    50000, 1, null, 0, true,
    now() - interval '1 day', now() + interval '30 days'
  ),
  (
    'HEMAT25RB', 'Potongan Rp25.000 tanpa minimal belanja', 'AMOUNT', 25000, 0,
    null, 1, 500, 0, true,
    null, now() + interval '14 days'
  )
on conflict (code) do nothing;

-- Attach an active flash sale to the first ACTIVE product, if any exist.
insert into public.flash_sales (product_id, discount_type, discount_value, is_active, starts_at, ends_at)
select id, 'PERCENT', 20, true, now() - interval '1 hour', now() + interval '2 days'
from public.products
where status = 'ACTIVE'
  and not exists (
    select 1 from public.flash_sales fs where fs.product_id = products.id
  )
order by created_at asc
limit 1;