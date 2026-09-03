-- ============================================================
-- Warungpedia migration 001 — Foundational infrastructure
-- ============================================================
-- Establishes the base PostgreSQL environment used by all later
-- migrations: required extensions and shared helper functions.
-- No application tables are created in this migration.

-- --- Extensions -------------------------------------------------
-- pgcrypto: gen_random_uuid() for UUID primary keys.
create extension if not exists "pgcrypto";

-- pg_trgm: trigram similarity — used for search/typo tolerance
-- (introduced in the search phase, enabled here as part of foundation).
create extension if not exists "pg_trgm";

-- --- Shared timestamp-update trigger ---------------------------
-- A common trigger function that sets `updated_at = now()` on INSERT
-- and UPDATE. Attach with:
--   create trigger X_updated_at before update on table
--   for each row execute function public.set_updated_at();
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --- Common app settings helper --------------------------------
-- Marketplace configuration is stored in a settings table and read via
-- a helper. (The table itself is created in a later migration; this
-- function is kept generic.)
create or replace function public.app_setting(p_key text)
returns text
language sql
stable
security definer
as $$
  select value from public.settings where key = p_key;
$$;
