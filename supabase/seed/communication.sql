-- Warungpedia demo seed — communication & notifications settings.
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