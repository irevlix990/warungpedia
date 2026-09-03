-- ============================================================
-- Warungpedia demo reviews, follows, wishlists & views
-- ============================================================
-- Development/demo data only (see supabase/seed/README.md). Idempotent:
-- safe to run repeatedly.
--
-- Everything is conditional on fixture data that earlier phases may or may
-- not have seeded (demo buyer, orders, products), so a fresh DB with no demo
-- commerce records fails gracefully instead of erroring.

-- 1) A verified review for the newest completed order line, if any exists.
insert into public.product_reviews
  (product_id, store_id, user_id, order_id, author_name, rating, title, body)
select
  oi.product_id,
  oi.store_id,
  o.user_id,
  o.id,
  coalesce(nullif(btrim(p.full_name), ''), 'Pembeli'),
  5,
  'Produk sesuai deskripsi',
  'Barang sampai tepat waktu dan kualitasnya bagus. Recommended!'
from public.orders o
join public.order_items oi on oi.order_id = o.id
join public.profiles p on p.id = o.user_id
where o.status in ('DELIVERED','COMPLETED')
  and oi.product_id is not null
  and not exists (
    select 1 from public.product_reviews r
    where r.user_id = o.user_id and r.product_id = oi.product_id
  )
order by o.created_at asc
limit 1
on conflict (user_id, product_id) do nothing;

-- 2) A second review on a different completed order line, if available.
insert into public.product_reviews
  (product_id, store_id, user_id, order_id, author_name, rating, title, body)
select
  oi.product_id,
  oi.store_id,
  o.user_id,
  o.id,
  coalesce(nullif(btrim(p.full_name), ''), 'Pembeli'),
  4,
  null,
  'Harga bersaing, pengemasan rapi. Sedikit terlambat tapi masih oke.'
from public.orders o
join public.order_items oi on oi.order_id = o.id
join public.profiles p on p.id = o.user_id
where o.status in ('DELIVERED','COMPLETED')
  and oi.product_id is not null
  and oi.product_id in (
    select r.product_id from public.product_reviews r
    where r.order_id = o.id
  )
  and oi.product_id not in (
    select r.product_id from public.product_reviews r
    where r.user_id = o.user_id
  )
order by o.created_at asc
limit 1
on conflict (user_id, product_id) do nothing;

-- 3) Demo buyer follows a couple of ACTIVE stores.
insert into public.store_follows (user_id, store_id)
select
  (select id from public.profiles order by created_at asc limit 1),
  s.id
from public.stores s
where s.status = 'ACTIVE'
  and not exists (
    select 1 from public.store_follows f
    where f.user_id = (select id from public.profiles order by created_at asc limit 1)
      and f.store_id = s.id
  )
limit 2
on conflict (user_id, store_id) do nothing;

-- 4) A default wishlist collection with the first ACTIVE products.
insert into public.wishlists (user_id, name)
select
  (select id from public.profiles order by created_at asc limit 1),
  'Tersimpan'
where not exists (
  select 1 from public.profiles p
  join public.wishlists w on w.user_id = p.id
  where w.name = 'Tersimpan'
);

insert into public.wishlist_items (wishlist_id, product_id)
select w.id, pr.id
from public.wishlists w
join public.profiles p on p.id = w.user_id
cross join public.products pr
where pr.status = 'ACTIVE'
  and not exists (
    select 1 from public.wishlist_items wi
    where wi.wishlist_id = w.id and wi.product_id = pr.id
  )
limit 3
on conflict (wishlist_id, product_id) do nothing;

-- 5) Recommendation foundation: log some product views for the demo buyer.
insert into public.product_views (user_id, product_id)
select
  (select id from public.profiles order by created_at asc limit 1),
  id
from public.products
where status = 'ACTIVE'
order by created_at asc
limit 5;
