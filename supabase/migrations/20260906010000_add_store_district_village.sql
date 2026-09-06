-- ============================================================
-- Migration: Add district & village columns to stores
-- ============================================================
-- Extends store location to kecamatan (district) and kelurahan/desa
-- (village) level for more precise address selection.

alter table public.stores
  add column if not exists district text,
  add column if not exists village text;