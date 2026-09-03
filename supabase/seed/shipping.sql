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