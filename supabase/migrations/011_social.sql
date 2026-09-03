-- ============================================================
-- Warungpedia migration 011 — Reviews, Wishlist & Social Commerce
-- ============================================================
-- Adds social and engagement features:
--
--   • Product reviews — buyers who received/delivered an order may write one
--     review per product (rating 1–5, optional title, required body). Reviews
--     are verified against order_items + order status to prevent fraud.
--     Denormalized aggregate fields on `products` (reviews_count,
--     rating_avg) and `stores` (rating_avg, rating_count) are kept in sync
--     by triggers.
--
--   • Store following — buyers follow stores to express interest. A toggle
--     definer keeps the PK clean.
--
--   • Wishlists — buyers own one or more named collections; each collection
--     holds products with an optional note. A "default" collection is created
--     on first add.
--
--   • Product views — every product page view is logged (user_id nullable for
--     anon). The log is the recommendation foundation; a helper extracts the
--     most-recently-viewed products for the "recently viewed" shelf.

-- ============================================================
-- Tables
-- ============================================================

-- One review per (user, product); store_id is denormalized for aggregation.
create table if not exists public.product_reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  store_id   uuid not null references public.stores   (id) on delete cascade,
  user_id    uuid not null references public.profiles  (id) on delete cascade,
  order_id   uuid not null references public.orders    (id) on delete cascade,
  author_name text not null,
  rating     integer not null check (rating between 1 and 5),
  title      text check (title is null or length(btrim(title)) between 1 and 120),
  body       text not null check (length(btrim(body)) between 1 and 2000),
  status     text not null default 'ACTIVE'
               check (status in ('ACTIVE','HIDDEN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index product_reviews_product_idx
  on public.product_reviews (product_id, status, created_at desc);
create index product_reviews_store_idx
  on public.product_reviews (store_id, status);
create index product_reviews_user_idx
  on public.product_reviews (user_id, created_at desc);

create trigger product_reviews_updated_at
  before update on public.product_reviews
  for each row execute function public.set_updated_at();

-- Denormalize aggregate onto products so the product page / card can render
-- rating without a separate query.
alter table public.products
  add column if not exists reviews_count integer not null default 0
    check (reviews_count >= 0);
alter table public.products
  add column if not exists rating_avg numeric(3,2) not null default 0
    check (rating_avg >= 0 and rating_avg <= 5);

-- Denormalize aggregate onto stores for the store card / rating badge.
alter table public.stores
  add column if not exists rating_avg   numeric(3,2) not null default 0
    check (rating_avg >= 0 and rating_avg <= 5);
alter table public.stores
  add column if not exists rating_count integer not null default 0
    check (rating_count >= 0);

-- Store following (toggle).
create table if not exists public.store_follows (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  store_id   uuid not null references public.stores   (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, store_id)
);

create index store_follows_store_idx on public.store_follows (store_id);

-- Named wishlist collections per user.
create table if not exists public.wishlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  name       text not null check (length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index wishlists_user_idx on public.wishlists (user_id, created_at);

create trigger wishlists_updated_at
  before update on public.wishlists
  for each row execute function public.set_updated_at();

-- Products inside a wishlist collection.
create table if not exists public.wishlist_items (
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  product_id  uuid not null references public.products  (id) on delete cascade,
  notes       text,
  created_at  timestamptz not null default now(),
  primary key (wishlist_id, product_id)
);

create index wishlist_items_product_idx on public.wishlist_items (product_id);

-- Recommendation foundation: raw view log.
create table if not exists public.product_views (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.profiles (id) on delete set null,
  product_id uuid not null references public.products (id) on delete cascade,
  viewed_at  timestamptz not null default now()
);

create index product_views_product_idx
  on public.product_views (product_id, viewed_at desc);
create index product_views_user_idx
  on public.product_views (user_id, viewed_at desc)
  where user_id is not null;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.product_reviews enable row level security;
alter table public.store_follows    enable row level security;
alter table public.wishlists        enable row level security;
alter table public.wishlist_items   enable row level security;
alter table public.product_views    enable row level security;

-- Reviews: ACTIVE are public; all statuses readable by owner and admins.
create policy "product_reviews_select"
  on public.product_reviews for select using (
    status = 'ACTIVE'
    or user_id = auth.uid()
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );
-- No direct client writes: all mutations go through security-definer RPCs.

-- Store follows: owner can see their follows; admins can see all.
create policy "store_follows_select"
  on public.store_follows for select using (
    user_id = auth.uid()
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Wishlists: owner-only reads.
create policy "wishlists_select"
  on public.wishlists for select using (
    user_id = auth.uid()
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Wishlist items: owner of the owning wishlist.
create policy "wishlist_items_select"
  on public.wishlist_items for select using (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_items.wishlist_id
        and (w.user_id = auth.uid()
             or public.current_role() in ('ADMIN','SUPER_ADMIN'))
    )
  );

-- Product views: insert-only from server; no client reads.
create policy "product_views_insert"
  on public.product_views for insert
  with check (true);

-- ============================================================
-- REVIEW AGGREGATE TRIGGERS
-- ============================================================
-- After insert / update / delete on product_reviews, recalculate the
-- denormalized aggregates on `products` and `stores`.

create or replace function public.sync_review_aggregates()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_product_id uuid;
  v_store_id   uuid;
  v_pid        uuid := coalesce(new.product_id, old.product_id);
  v_sid        uuid := coalesce(new.store_id,   old.store_id);
begin
  -- Recalculate product aggregate.
  update public.products p
  set reviews_count = coalesce(s.cnt, 0),
      rating_avg    = coalesce(s.avg, 0)
  from (
    select count(*)::int cnt, coalesce(round(avg(rating), 2), 0) avg
    from public.product_reviews
    where product_id = v_pid and status = 'ACTIVE'
  ) s
  where p.id = v_pid;

  -- Recalculate store aggregate.
  update public.stores s
  set rating_count = coalesce(a.cnt, 0),
      rating_avg   = coalesce(a.avg, 0)
  from (
    select count(*)::int cnt, coalesce(round(avg(rating), 2), 0) avg
    from public.product_reviews
    where store_id = v_sid and status = 'ACTIVE'
  ) a
  where s.id = v_sid;

  return coalesce(new, old);
end;
$$;

create trigger product_reviews_sync_aggregates
  after insert or update or delete on public.product_reviews
  for each row execute function public.sync_review_aggregates();

-- ============================================================
-- Security-definer RPCs — Reviews
-- ============================================================

-- Verify purchase + uniqueness, then insert.
create or replace function public.create_review(
  p_order_id uuid,
  p_product_id uuid,
  p_rating  integer,
  p_title   text,
  p_body    text
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_store_id uuid;
  v_order    record;
  v_status   text;
  v_author   text;
  v_rating   integer := greatest(1, least(5, p_rating));
  v_title    text    := nullif(btrim(p_title), '');
  v_body     text    := btrim(p_body);
  v_id       uuid;
begin
  if v_uid is null then
    raise exception 'Silakan masuk terlebih dahulu.'
      using errcode = '42501';
  end if;

  if v_body = '' or length(v_body) < 1 or length(v_body) > 2000 then
    raise exception 'Ulasan harus 1–2000 karakter.'
      using errcode = '23514';
  end if;

  -- Snapshot the author's display name (profiles are not publicly readable).
  select coalesce(nullif(btrim(full_name), ''), au.email)
  into v_author
  from public.profiles p
  join auth.users au on au.id = p.id
  where p.id = v_uid;
  if v_author is null or v_author = '' then
    v_author := 'Pembeli';
  end if;

  -- Order must belong to the buyer and be in a reviewable terminal state.
  select o.id, o.status, o.user_id
  into v_order
  from public.orders o
  where o.id = p_order_id;

  if v_order is null then
    raise exception 'Pesanan tidak ditemukan.'
      using errcode = 'P0002';
  end if;
  if v_order.user_id != v_uid then
    raise exception 'Anda bukan pemilik pesanan ini.'
      using errcode = '42501';
  end if;
  if v_order.status not in ('DELIVERED','COMPLETED') then
    raise exception 'Pesanan belum selesai.'
      using errcode = '23514';
  end if;

  -- The product must exist in the order's items.
  select oi.store_id into v_store_id
  from public.order_items oi
  where oi.order_id = p_order_id
    and oi.product_id = p_product_id
  limit 1;

  if v_store_id is null then
    raise exception 'Produk tidak ada di pesanan ini.'
      using errcode = 'P0002';
  end if;

  -- Prevent duplicate review.
  if exists (
    select 1 from public.product_reviews
    where user_id = v_uid and product_id = p_product_id
  ) then
    raise exception 'Anda sudah mengulas produk ini.'
      using errcode = '23505';
  end if;

  insert into public.product_reviews
    (product_id, store_id, user_id, order_id, author_name, rating, title, body)
  values
    (p_product_id, v_store_id, v_uid, p_order_id, v_author, v_rating, v_title, v_body)
  returning id into v_id;

  return v_id;
end;
$$;

-- Owner can update their own review.
create or replace function public.update_review(
  p_review_id uuid,
  p_rating integer,
  p_title  text,
  p_body   text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_rating  integer := greatest(1, least(5, p_rating));
  v_title   text    := nullif(btrim(p_title), '');
  v_body    text    := btrim(p_body);
  v_review  record;
begin
  select * into v_review
  from public.product_reviews
  where id = p_review_id;

  if v_review is null then
    raise exception 'Ulasan tidak ditemukan.'
      using errcode = 'P0002';
  end if;
  if v_review.user_id != v_uid then
    raise exception 'Anda bukan pemilik ulasan ini.'
      using errcode = '42501';
  end if;
  if v_body = '' or length(v_body) < 1 or length(v_body) > 2000 then
    raise exception 'Ulasan harus 1–2000 karakter.'
      using errcode = '23514';
  end if;

  update public.product_reviews
  set rating = v_rating, title = v_title, body = v_body
  where id = p_review_id;
end;
$$;

-- Owner or admin can soft-hide a review.
create or replace function public.set_review_status(
  p_review_id uuid,
  p_status    text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_review record;
  v_role   text;
begin
  select * into v_review
  from public.product_reviews where id = p_review_id;

  if v_review is null then
    raise exception 'Ulasan tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  v_role := public.current_role();

  if v_review.user_id != v_uid
     and v_role not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Tidak diizinkan.'
      using errcode = '42501';
  end if;

  if p_status not in ('ACTIVE','HIDDEN') then
    raise exception 'Status tidak valid.'
      using errcode = '23514';
  end if;

  -- Only admins can set ACTIVE again (un-hide); owners can only hide.
  if p_status = 'ACTIVE' and v_role not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Hanya admin yang dapat memunculkan kembali ulasan.'
      using errcode = '42501';
  end if;

  update public.product_reviews set status = p_status where id = p_review_id;
end;
$$;

-- ============================================================
-- Security-definer RPCs — Store following
-- ============================================================

-- Toggle follow: returns true if now following, false if unfollowed.
create or replace function public.toggle_store_follow(p_store_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_exists boolean;
begin
  if v_uid is null then
    raise exception 'Silakan masuk terlebih dahulu.'
      using errcode = '42501';
  end if;

  if not exists (select 1 from public.stores where id = p_store_id) then
    raise exception 'Toko tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  select exists (
    select 1 from public.store_follows
    where user_id = v_uid and store_id = p_store_id
  ) into v_exists;

  if v_exists then
    delete from public.store_follows
    where user_id = v_uid and store_id = p_store_id;
    return false;
  else
    insert into public.store_follows (user_id, store_id)
    values (v_uid, p_store_id);
    return true;
  end if;
end;
$$;

-- ============================================================
-- Security-definer RPCs — Wishlists
-- ============================================================

-- Create a named collection. Returns the new wishlist id.
create or replace function public.create_wishlist(p_name text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_name text := btrim(p_name);
  v_id   uuid;
begin
  if v_uid is null then
    raise exception 'Silakan masuk terlebih dahulu.'
      using errcode = '42501';
  end if;
  if v_name = '' or length(v_name) > 80 then
    raise exception 'Nama koleksi harus 1–80 karakter.'
      using errcode = '23514';
  end if;

  insert into public.wishlists (user_id, name)
  values (v_uid, v_name)
  returning id into v_id;

  return v_id;
end;
$$;

-- Rename a collection (owner only).
create or replace function public.rename_wishlist(
  p_wishlist_id uuid,
  p_name text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_name text := btrim(p_name);
  v_wl   record;
begin
  select * into v_wl from public.wishlists where id = p_wishlist_id;
  if v_wl is null then
    raise exception 'Koleksi tidak ditemukan.'
      using errcode = 'P0002';
  end if;
  if v_wl.user_id != v_uid then
    raise exception 'Bukan koleksi Anda.'
      using errcode = '42501';
  end if;
  if v_name = '' or length(v_name) > 80 then
    raise exception 'Nama koleksi harus 1–80 karakter.'
      using errcode = '23514';
  end if;

  update public.wishlists set name = v_name where id = p_wishlist_id;
end;
$$;

-- Delete a collection (owner only). Items cascade.
create or replace function public.delete_wishlist(p_wishlist_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_wl  record;
begin
  select * into v_wl from public.wishlists where id = p_wishlist_id;
  if v_wl is null then
    raise exception 'Koleksi tidak ditemukan.'
      using errcode = 'P0002';
  end if;
  if v_wl.user_id != v_uid then
    raise exception 'Bukan koleksi Anda.'
      using errcode = '42501';
  end if;

  delete from public.wishlists where id = p_wishlist_id;
end;
$$;

-- Add a product to a wishlist (or update notes if already present).
-- When no wishlist_id is provided, uses or creates the "Tersimpan" default.
create or replace function public.add_to_wishlist(
  p_product_id  uuid,
  p_wishlist_id uuid default null,
  p_notes       text  default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_wl_id  uuid;
  v_wl     record;
begin
  if v_uid is null then
    raise exception 'Silakan masuk terlebih dahulu.'
      using errcode = '42501';
  end if;

  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'Produk tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  -- Resolve target wishlist.
  v_wl_id := p_wishlist_id;
  if v_wl_id is null then
    select id into v_wl_id
    from public.wishlists
    where user_id = v_uid and name = 'Tersimpan'
    limit 1;

    if v_wl_id is null then
      insert into public.wishlists (user_id, name)
      values (v_uid, 'Tersimpan')
      returning id into v_wl_id;
    end if;
  else
    select * into v_wl from public.wishlists where id = v_wl_id;
    if v_wl is null then
      raise exception 'Koleksi tidak ditemukan.'
        using errcode = 'P0002';
    end if;
    if v_wl.user_id != v_uid then
      raise exception 'Bukan koleksi Anda.'
        using errcode = '42501';
    end if;
  end if;

  insert into public.wishlist_items (wishlist_id, product_id, notes)
  values (v_wl_id, p_product_id, nullif(btrim(p_notes), ''))
  on conflict (wishlist_id, product_id)
  do update set notes = nullif(btrim(p_notes), '');

  return v_wl_id;
end;
$$;

-- Remove a product from a wishlist.
create or replace function public.remove_from_wishlist(
  p_wishlist_id uuid,
  p_product_id  uuid
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_wl  record;
begin
  select * into v_wl from public.wishlists where id = p_wishlist_id;
  if v_wl is null then
    raise exception 'Koleksi tidak ditemukan.'
      using errcode = 'P0002';
  end if;
  if v_wl.user_id != v_uid then
    raise exception 'Bukan koleksi Anda.'
      using errcode = '42501';
  end if;

  delete from public.wishlist_items
  where wishlist_id = p_wishlist_id and product_id = p_product_id;
end;
$$;

-- ============================================================
-- Security-definer RPCs — Product views (recommendation foundation)
-- ============================================================

-- Log a product view. Silently succeeds (best-effort).
create or replace function public.record_product_view(p_product_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  insert into public.product_views (user_id, product_id)
  values (v_uid, p_product_id);
end;
$$;

-- Get recently viewed products for a user (last N distinct product ids).
create or replace function public.get_recently_viewed(p_limit integer default 20)
returns table (product_id uuid, viewed_at timestamptz)
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;
  end if;

  return query
  select distinct on (pv.product_id) pv.product_id, pv.viewed_at
  from public.product_views pv
  where pv.user_id = v_uid
  order by pv.product_id, pv.viewed_at desc
  limit p_limit;
end;
$$;

-- Get related products for a given product (same category, excluding self),
-- sorted by rating and review count. Foundation for future collaborative
-- filtering.
create or replace function public.get_related_products(
  p_product_id uuid,
  p_limit      integer default 12
)
returns table (
  product_id   uuid,
  slug         text,
  name         text,
  price        integer,
  image_url    text,
  reviews_count integer,
  rating_avg   numeric
)
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_cat_id uuid;
begin
  select category_id into v_cat_id
  from public.products where id = p_product_id;

  if v_cat_id is null then
    return;
  end if;

  return query
  select p.id, p.slug, p.name, p.price,
         (p.image_urls)[1],
         p.reviews_count,
         p.rating_avg
  from public.products p
  where p.category_id = v_cat_id
    and p.id != p_product_id
    and p.status = 'ACTIVE'
  order by p.rating_avg desc, p.reviews_count desc, p.created_at desc
  limit p_limit;
end;
$$;

-- ============================================================
-- Indexes on denormalized aggregate columns (for filtering/sorting)
-- ============================================================
create index products_rating_idx
  on public.products (rating_avg desc, reviews_count desc)
  where status = 'ACTIVE';
create index stores_rating_idx
  on public.stores (rating_avg desc, rating_count desc)
  where status = 'ACTIVE';
