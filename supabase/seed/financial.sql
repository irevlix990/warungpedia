-- Demo financial settings for Warungpedia.
-- Commission rate: 5% (500 basis points). Withdrawal minimum: Rp50,000.
-- These are development defaults; admins manage them via the admin CMS later.
insert into public.settings (key, value, description) values
  ('payments.commission_rate', '{"rate_bps": 500}', 'Marketplace commission rate in basis points (500 = 5%).'),
  ('payments.withdrawal_min', '{"min_amount": 50000}', 'Minimum seller withdrawal in integer IDR.')
on conflict (key) do nothing;
