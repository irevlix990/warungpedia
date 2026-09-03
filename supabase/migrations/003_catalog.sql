-- ============================================================
-- Warungpedia migration 003 — Catalog foundation (categories)
-- ============================================================
-- Defines the hierarchical `categories` table that drives the homepage,
-- catalog browsing, and the product taxonomy (products attach to it in a
-- later phase), plus RLS rules: anyone can browse active categories,
-- only admins manage the taxonomy.
--
-- Demo taxonomy is seeded from supabase/seed/catalog.sql (not here), so
-- migrations stay schema-only and the demo data stays clearly labeled.

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  parent_id   uuid references public.categories (id) on delete cascade,
  image_url   text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index categories_parent_idx on public.categories (parent_id)
  where parent_id is not null;

create index categories_sort_order_idx on public.categories (sort_order)
  where is_active;

create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.categories enable row level security;

-- The public catalog: anyone (including anonymous visitors) can browse
-- active categories; admins additionally manage inactive rows.
create policy "categories_select_public"
  on public.categories for select
  using (is_active = true or public.current_role() in ('ADMIN','SUPER_ADMIN'));

-- Only admins / super admins may create, update or delete taxonomy rows.
create policy "categories_admin_write"
  on public.categories for all
  using (public.current_role() in ('ADMIN','SUPER_ADMIN'))
  with check (public.current_role() in ('ADMIN','SUPER_ADMIN'));