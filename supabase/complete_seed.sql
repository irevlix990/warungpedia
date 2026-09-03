-- ============================================================
-- Warungpedia demo catalog taxonom
-- ============================================================
-- Development/demo data only (see supabase/seed/README.md and
-- docs/ENVIRONMENT.md). Idempotent: safe to run repeatedly.

insert into public.categories (slug, name, description, parent_id, sort_order) values
  ('elektronik', 'Elektronik', 'Gadget, laptop, TV, dan perangkat elektronik lainnya.', null, 10),
  ('fashion', 'Fashion', 'Pakaian, alas kaki, dan aksesoris gaya.', null, 20),
  ('kecantikan', 'Kecantikan', 'Skincare, kosmetik, dan perawatan diri.', null, 30),
  ('kesehatan', 'Kesehatan', 'Vitamin, alat kesehatan, dan kebutuhan harian.', null, 40),
  ('rumah-tangga', 'Rumah Tangga', 'Perabot, dekorasi, dan kebutuhan rumah.', null, 50),
  ('makanan-minuman', 'Makanan & Minuman', 'Makanan ringan, minuman, dan bahan dapur.', null, 60),
  ('olahraga', 'Olahraga', 'Alat olahraga dan perlengkapan kebugaran.', null, 70),
  ('buku-alat-tulis', 'Buku & Alat Tulis', 'Buku, novel, dan perlengkapan sekolah.', null, 80),
  ('mainan-hobi', 'Mainan & Hobi', 'Mainan anak dan alat hobi.', null, 90),
  ('bayi-anak', 'Bayi & Anak', 'Perlengkapan bayi dan anak.', null, 100),
  ('perlengkapan-hewan', 'Perlengkapan Hewan', 'Makanan hewan dan aksesoris peliharaan.', null, 110)
on conflict (slug) do nothing;

insert into public.categories (slug, name, description, parent_id, sort_order)
select 'elektronik-hp-tablet', 'HP & Tablet', 'Ponsel pintar dan tablet berbagai merek.', id, 11
from public.categories where slug = 'elektronik'
on conflict (slug) do nothing;

insert into public.categories (slug, name, description, parent_id, sort_order)
select 'elektronik-laptop-komputer', 'Laptop & Komputer', 'Laptop, desktop, dan komponennya.', id, 12
from public.categories where slug = 'elektronik'
on conflict (slug) do nothing;

insert into public.categories (slug, name, description, parent_id, sort_order)
select 'fashion-pria', 'Fashion Pria', 'Pakaian dan aksesoris pria.', id, 21
from public.categories where slug = 'fashion'
on conflict (slug) do nothing;

insert into public.categories (slug, name, description, parent_id, sort_order)
select 'fashion-wanita', 'Fashion Wanita', 'Pakaian dan aksesoris wanita.', id, 22
from public.categories where slug = 'fashion'
on conflict (slug) do nothing;

insert into public.categories (slug, name, description, parent_id, sort_order)
select 'rumah-tangga-dapur', 'Dapur', 'Perlengkapan memasak dan alat dapur.', id, 51
from public.categories where slug = 'rumah-tangga'
on conflict (slug) do nothing;

insert into public.categories (slug, name, description, parent_id, sort_order)
select 'kesehatan-obat', 'Obat & Suplemen', 'Obat bebas dan suplemen kesehatan.', id, 41
from public.categories where slug = 'kesehatan'
on conflict (slug) do nothing;
-- Demo return-reason dictionary for Warungpedia (Phase 8).
insert into public.return_reasons (code, label, sort_order) values
  ('WRONG_ITEM',   'Barang tidak sesuai pesanan',        1),
  ('DEFECTIVE',    'Barang rusak / cacat',               2),
  ('NOT_RECEIVED', 'Pesanan tidak diterima',             3),
  ('DIFFERENT',    'Barang tidak sesuai deskripsi',      4),
  ('OTHER',        'Alasan lain',                        5)
on conflict (code) do nothing;

-- Demo marketplace setting: 30-day return window.
insert into public.settings (key, value, description) values
  ('returns.window_days', '{"days": 30}', 'Buyer return window in days from order completion.')
on conflict (key) do nothing;
-- Warungpedia demo seed â€” communication & notifications settings.
-- Idempotent: safe to re-run after a `db reset`.


insert into public.notification_types (code, label)
values
  ('ORDER_UPDATE', 'Pembaruan Pesanan'),
  ('RETURN_UPDATE', 'Pembaruan Pengembalian'),
  ('DISPUTE', 'Sengketa'),
  ('CHAT', 'Pesan Chat'),
  ('PROMOTION', 'Promo & Penawaran')
on conflict (code) do nothing;

-- Email notification fan-out is off by default and only enabled with a real
-- Edge Function URL. These also appear in `docs/ENVIRONMENT.md`.
insert into public.settings (key, value)
values
  ('notifications.email_enabled', '{"enabled": false}'),
  ('notifications.email_url', '{"url": ""}')
on conflict (key) do nothing;
