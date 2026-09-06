-- ============================================================
-- Migration: Add village column to addresses
-- ============================================================
-- The cascading address select emits village (kelurahan/desa) data
-- but the addresses table lacked a column for it.

alter table public.addresses
  add column if not exists village text;
