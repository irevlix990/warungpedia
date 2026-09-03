# Seed Data

Directory for Warungpedia development seed data.

## Purpose

Provides safe, clearly-labeled **development/demo** data so the app is
usable locally without provisioning real marketplace data. Development
accounts and demo records are never intended for production.

## Approach

Seed data lives in SQL files here, referencing the migration-defined schema.
Each demo record uses obviously demo credentials (see `docs/ENVIRONMENT.md`
for the demo account table, maintained per phase). `supabase/seed.sql` is the
entry point the CLI loads after migrations (`\i` includes).

Seeding is idempotent where practical (use `on conflict do nothing` /
`do update`) so it can be re-run safely.

## Current seed content

- `catalog.sql` — demo category taxonomy (top-level + subcategories).
- `financial.sql` — demo marketplace settings: 5% commission
  (`payments.commission_rate` = `{"rate_bps": 500}`) and Rp50,000 withdrawal
  minimum (`payments.withdrawal_min` = `{"min_amount": 50000}`). Idempotent
  via `on conflict (key) do nothing`.
- `shipping.sql` — demo return reasons (seeded `return_reasons`: WRONG_ITEM,
  DEFECTIVE, NOT_RECEIVED, DIFFERENT, OTHER) and the default return window
  (`returns.window_days` = 30). Idempotent via `on conflict (code) do nothing`.
- `communication.sql` — demo notification types (ORDER_UPDATE, RETURN_UPDATE,
  DISPUTE, CHAT, PROMOTION) and the email fan-out settings
  (`notifications.email_enabled` = off, `notifications.email_url` = empty).
  Idempotent via `on conflict (code)/(key) do nothing`.
- `promotions.sql` — two demo vouchers (`HEMAT10` = 10% off min. Rp150.000,
  `HEMAT25RB` = fixed Rp25.000) and, when any ACTIVE product exists, a 20% off
  flash sale on the first one. Idempotent via `on conflict (code) do nothing`
  and an existence guard for the flash sale.
- `social.sql` — demo reviews (a 5★ and a 4★ on distinct completed order
  lines, if the commerce fixture data exists), a couple of store follows for
  the demo buyer, a `Tersimpan` wishlist with its first ACTIVE products, and a
  handful of product views for the recently-viewed shelf. All conditional /
  idempotent (`on conflict do nothing`).

## Planned seed content (added in later phases)

- Demo roles & admin accounts (Super Admin, Admin)
- Demo buyer / seller accounts
- Demo store
- Demo products (reviews for them are now demo-seeded in `social.sql`)
- Demo orders
- Demo wallets / ledger / earnings / withdrawals

As each phase lands, the corresponding demo records are added here and
documented in `docs/ENVIRONMENT.md`.
