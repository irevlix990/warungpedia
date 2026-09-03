# Database

This document describes Warungpedia's database design and migration workflow.
It reflects the schema currently defined in `supabase/migrations/`.

## Platform

- **Supabase** (hosted PostgreSQL).
- Schema changes are versioned SQL migrations under `supabase/migrations/`.
  The migrations are the **single source of truth** for the schema.
- The Supabase CLI manages/stacks migrations (`supabase db push` for hosted,
  `supabase db reset` for local).

## Migration workflow

Migrations are numbered (`001_...sql`, `002_...sql`, ...). Each migration is
applied in order. Apply against a linked project:

```bash
supabase login
supabase link --project-ref <ref>
supabase db push
```

Regenerate the typed client after schema changes:

```bash
supabase gen types typescript --local > src/types/database.ts
```

## Current migrations

| Migration | Purpose                                                    |
| --------- | ---------------------------------------------------------- |
| `001_extensions.sql` | Foundational extensions (`pgcrypto`, `pg_trgm`) and shared helpers (`set_updated_at`, `app_setting`). |
| `002_auth_profiles.sql` | Auth foundation: `settings`, `profiles` (one row per `auth.users`, holds `role` + profile fields), `addresses`, RBAC helper `current_role()`, auth triggers, RLS policies. |
| `003_catalog.sql` | Catalog foundation: hierarchical `categories` taxonomy for the homepage and catalog browsing, public-read RLS, admin-only writes. |
| `004_stores.sql` | Seller system: `stores` table (lifecycle `PENDING/ACTIVE/REJECTED/SUSPENDED/CLOSED`) + security-definer mutation functions that enforce ownership and prevent self-approval. |
| `005_products.sql` | Product & inventory: `products` table (integer-IDR price, stock, images, `DRAFT/ACTIVE/ARCHIVED` lifecycle) + security-definer create/update/status/stock/delete functions. |
| `006_cart_checkout.sql` | Cart & checkout: `carts`, `cart_items`, `orders`, `order_items` snapshot tables + security-definer cart mutations and the atomic `place_order` checkout transaction. |
| `007_financial.sql` | Payments & financial ledger: `payments`, `wallets`, `ledger_entries`, `seller_earnings`, `withdrawals` + security-definer `pay_order`, `request_withdrawal`, `approve_withdrawal`, `reject_withdrawal` and credit/debit wallet helpers. |
| `008_shipping_returns.sql` | Shipping, returns & disputes: `return_reasons`, `shipments`, `returns`, `disputes` + security-definer `ship_order`, `confirm_receipt`, `refund_line`, `request_return`, `respond_return`, `escalate_dispute`, `resolve_dispute`; order/shipment seller-read RLS; `seller_earnings.status` gains `REFUNDED`. |
| `009_communication.sql` | Communication & notifications: `notification_types`, `notifications`, `conversations`, `messages` + notification/chat definers, event-driven notification triggers, pg_net email webhook; `profiles.notification_prefs` honored everywhere. |
| `010_promotions.sql` | Promotions: `vouchers`, `user_voucher_redemptions`, `flash_sales` + admin definers, `validate_voucher`/`active_flash_price` helpers, and a flash-sale, voucher-aware rewrite of `place_order`; `orders` gains `discount` and `voucher_id`. |
| `011_social.sql` | Reviews, wishlist & social commerce: `product_reviews`, `store_follows`, `wishlists`, `wishlist_items`, `product_views`; review/purchase-verification, follow, wishlist and product-view definers; denormalized rating aggregates on `products`/`stores` kept in sync by triggers. |
| `012_admin.sql` | Admin & CMS: admin-only definer RPCs for the dashboard stats (`admin_dashboard_stats`), user directory with emails (`admin_list_users`), and role elevation (`admin_set_user_role`, SUPER_ADMIN-only). |
| `013_analytics.sql` | Analytics: store-owner/admin definers for KPI bundles, product analytics, daily series and customer analytics (`seller_overview`, `seller_product_analytics`, `seller_sales_series`, `seller_customer_analytics`, plus a shared store-ownership guard) and admin marketplace KPIs (`admin_marketplace_analytics`). |

## Applied schema

- **`settings`** — configurable marketplace-wide settings (commission,
  withdrawal minimum, return window) stored as JSONB; read by
  `app_setting()`, writeable only by admins.
- **`profiles`** — `id` = `auth.users.id` (FK cascade), `full_name`, `phone`,
  `avatar_url`, `role` (`BUYER` default), `preferred_locale`, theme, and
  notification prefs. A `handle_new_user` trigger auto-creates the row; a
  `sync_email_verified` trigger keeps verification in sync.
- **`addresses`** — owner-scoped shipping addresses with a single-default
  invariant enforced by `enforce_single_default_address()`.
- **`categories`** — hierarchical catalog taxonomy (`parent_id` self-FK,
  `slug` unique, `is_active`, `sort_order`). Products reference it. Public
  catalog reads; admin-only management.
- **`stores`** — seller-owned entity behind each storefront. `owner_id`
  unique (one store per user), `slug` unique, lifecycle
  `PENDING → ACTIVE/REJECTED → SUSPENDED/CLOSED`. Created as `PENDING`;
  `approve_store` elevates the owner's role to `SELLER`. Owners can never
  self-approve (RLS blocks `ACTIVE`, and only admin definer functions move
  status).
- **`products`** — each product belongs to an `ACTIVE` store, optionally a
  `category`, with a store-scoped unique `slug`. `price`/`compare_at_price`
  are integer IDR; `compare_at_price` must exceed `price`; `stock` and
  `low_stock_threshold` drive stock-level display; `image_urls` is a text
  array; lifecycle `DRAFT/ACTIVE/ARCHIVED` with `is_featured` for emphasis.
- **`carts` / `cart_items`** — one cart per user (`user_id` unique), holding
  line items (`cart_id` + `product_id` unique, `quantity` capped to 99).
- **`orders`** — buyer order header with `PENDING/PAID/.../CANCELLED` status
  and integer-IDR `subtotal`/`shipping_fee`/`total`. Created by `place_order`.
- **`order_items`** — snapshot lines (`product_name`, `product_price`, owned by
  a `store_id`) preserving what was actually sold even if the product is later
  edited or removed.
- **`payments`** — buyer payment records per order (`order_id`, `method`
  `WALLET/BANK_TRANSFER/COD`, integer-IDR `amount`, `PENDING/SUCCEEDED/FAILED`
  status, optional `reference`). Buyers and admins may read; written only by
  the `pay_order` definer.
- **`wallets`** — one wallet per user (`user_id` unique) holding the integer-IDR
  `balance` (never negative). Owner reads their own; only admin definers write.
- **`ledger_entries`** — append-only record of every wallet movement: signed
  `amount` (positive credit / negative debit), the resulting `balance_after`
  for reconciliation, a `type` (`SALE/COMMISSION/WITHDRAWAL/PAYMENT/REFUND/
  ADJUSTMENT`), optional `reference_id`, and a human `description`.
- **`seller_earnings`** — per-line marketplace revenue recognized at payment:
  gross sale, marketplace `commission`, and `net` credited to the seller's
  wallet, with `AVAILABLE/PAID_OUT/REFUNDED` status (`REFUNDED` marks a line
  whose `net` was clawed back via the `REFUND` ledger entry on a return).
- **`withdrawals`** — seller payout requests (`amount`, bank details, lifecycle
  `PENDING/APPROVED→PROCESSING/PAID/REJECTED` with `rejection_reason`). Funds
  are reserved from the wallet as a ledger debit at request time and returned
  on rejection.
- **`return_reasons`** — seedable catalog of return reasons (`code`, `label`,
  `sort_order`, `is_active`) shown in the buyer return dropdown.
- **`shipments`** — one tracking record per shipped order (`order_id` unique,
  `carrier`, `tracking_number`, `shipped_at`). Written only by the `ship_order`
  definer, which requires the acting seller to own the order.
- **`returns`** — per-line buyer return requests (`order_id` + `order_item_id`),
  optional `reason_id`/`note`, lifecycle
  `REQUESTED → APPROVED/REJECTED → REFUNDED/CANCELLED`, with a nullable
  `refund_amount` and `seller_note`. `status` gates the definer transitions.
- **`disputes`** — admin-resolved escalations of `REJECTED` returns
  (`return_id`, both parties, `reason`, lifecycle `OPEN → APPROVED/REJECTED →
  CLOSED`) with `resolution`, `decided_by`, `decided_at`.
- **`notification_types`** — a small dictionary (`code`, `label`) the
  notification system references by code, e.g. `ORDER_UPDATE`, `RETURN_UPDATE`,
  `DISPUTE`, `CHAT`, `PROMOTION`. Empty placeholders in `notifications`.
- **`notifications`** — per-user in-app notifications (`user_id`, `type`,
  `title`, `body`, `link`, `is_read`, `read_at`). Rows are created only by the
  `notify_user` definer (which honors the recipient's preferences), never by
  direct client writes.
- **`conversations`** — buyer–seller chat scoped to an order, one conversation
  per `(order_id, seller_id)`, with `last_message_at` for ordering and unread
  badges.
- **`vouchers`** — admin-issued discount codes (`code` unique uppercase,
  `PERCENT`/`AMOUNT`, `min_spend`, optional `max_discount`, `per_user_limit`,
  optional `total_usage_limit` + running `uses_count`, active/start/expiry).
  Discounts borne by the marketplace: they reduce `orders.total` but not
  per-line earnings.
- **`user_voucher_redemptions`** — one row per voucher use, linking the voucher
  to the user and order with the applied `discount_amount`; drives per-user and
  total usage limits and enables audit. Written only by `place_order`.
- **`flash_sales`** — admin-scheduled, time-limited per-product discounts
  (`product_id`, `PERCENT`/`AMOUNT`, active window). Publicly read for badges;
  prices are recomputed inside `place_order` so checkout is authoritative.
- **`orders.discount` / `orders.voucher_id`** — the applied voucher amount and
  voucher (nullable), so a promoted order is auditable and displayable.
- **`product_reviews`** — one review per `(user_id, product_id)`, verified
  against an owning `DELIVERED`/`COMPLETED` order via `order_items`. Store a
  snapshot `author_name` (profiles are not publicly readable), a `rating`
  (1–5), optional `title`, required `body`, and a moderation `status`
  (`ACTIVE`/`HIDDEN`). `store_id` is denormalized for store aggregation.
- **`products.reviews_count` / `products.rating_avg`** and
  **`stores.rating_avg` / `stores.rating_count`** — denormalized aggregates
  maintained by the `sync_review_aggregates` trigger so cards / pages show
  ratings without a per-page aggregate query.
- **`store_follows`** — composite PK `(user_id, store_id)` buyer–store follows.
- **`wishlists`** — named buyer collections (`user_id`, unique `name`).
- **`wishlist_items`** — composite PK `(wishlist_id, product_id)` with optional
  `notes`; a default `Tersimpan` collection is auto-created on first add.
- **`product_views`** — append-only view log (`user_id` nullable for anon,
  `product_id`, `viewed_at`). The recommendation foundation: `get_recently_viewed`
  derives the most-recently-viewed distinct products, and future
  collaborative-filtering phases can mine co-views/co-purchases from it.
- **`messages`** — a chat message within a conversation (`sender_id`, `body`,
  `is_read`, `read_at`). Created only by the `send_message` definer, which
  validates participation, bumps the conversation, and notifies the recipient.
- **Notification preferences** — stored as JSONB on `profiles.notification_prefs`
  with shape `{ email, push, types: { <type>: bool } }`. `notify_allowed`
  resolves opt-outs; `notify_user` and `maybe_send_email_notification` both
  consult it before writing / emailing.
- **RBAC helper `current_role()`** — returns the acting user's role for RLS
  without exposing the profiles table to arbitrary reads.

## Conventions (applied as tables are added)

- **UUID** internal identifiers (via `gen_random_uuid()`); human-readable
  public identifiers where useful (e.g. order `WP-YYYYMMDD-NNNNNN`).
- **Foreign keys** with appropriate `ON DELETE` behavior.
- **Timestamps** stored as `timestamptz` (UTC) and converted for display.
- **Integer IDR** for all money columns; no floats.
- **Ledger-based financials.** Mutable balances are not the sole source of
  truth; a history-preserving ledger records every financial movement.
- **Soft delete / archival** for financial and audit records — no destructive
  deletes for orders, payments, wallet transactions, withdrawals, refunds, or
  audit logs.

## RLS (Row Level Security)

RLS is enabled and enforced on `profiles`, `addresses`, `settings`,
`categories`, `stores`, `products`, `carts`, `cart_items`, `orders`, and
`order_items`.

- Buyers may read/update only their own `profiles` and `addresses`; admins
  (`ADMIN`/`SUPER_ADMIN`) may read/update all.
- `profiles` inserts are blocked at the RLS layer — rows are created only by
  the `handle_new_user` auth trigger.
- Addresses are owner-scoped for all operations (profile-role elevation for
  admins).
- `settings` are readable by authenticated users and writeable only by
  admins.
- `categories` are publicly readable when active (anon + authenticated) and
  writeable only by admins.
- `stores` are readable publicly when `ACTIVE`; owners see their own row
  (any status) and admins see all. Inserts are owner-scoped PENDING only.
  Update/delete flow through the definer functions, which enforce the
  lifecycle and admin-only elevation.
- `products` are readable publicly when `ACTIVE` **and** the parent store is
  `ACTIVE`; a store owner sees all their own products; admins see all.
  Inserts/updates/deletes flow through definer functions that check store
  ownership/status and restrict seller deletes to `DRAFT`/`ARCHIVED`.
- `carts`/`cart_items` are owner-scoped (via the owning cart). `orders` are
  buyer-visible + admin-visible, plus the seller who owns the order (via
  `orders_select_seller`); `order_items` are visible to the buyer, the item's
  store owner, and admins; `shipments` follow the same order-visibility set.
- `payments` are readable by the buyer and admins; `ledger_entries`,
  `seller_earnings`, and `withdrawals` are readable by the owner and admins.
  `wallets` are readable by the owner and updateable by admins; `withdrawals`
  are insertable by the owner and updateable by admins.
- `notification_types` are readable by everyone and maintainable by admins;
  `notifications` are readable by the owner and admins (no client writes);
  `conversations` are readable by the buyer, the seller, and admins; `messages`
  are readable by the participants of the owning conversation and admins.
- `vouchers` and `user_voucher_redemptions` are readable only by admins (and
  redemptions by their owner); validation/application never flows through
  direct client writes. `flash_sales` are publicly readable in their window and
  written only by admins.
- `product_reviews` are `ACTIVE` to everyone, all statuses to their owner and
  admins (no direct client writes). `store_follows` are readable by the owner
  and admins. `wishlists` are owner-only reads; `wishlist_items` via the owning
  wishlist. `product_views` are insert-only (no client reads).
- All financial writes flow through security-definer functions (never direct
  client writes): `pay_order` collects a PENDING order's payment atomically —
  locking the order, marking it `PAID`, and recognizing per-line
  `seller_earnings` with `credit_wallet` + ledger entries in one transaction.
  `request_withdrawal` validates the minimum and reserves funds via
  `debit_wallet`; `approve_withdrawal` moves it to `PROCESSING`;
  `reject_withdrawal` credits the reserved funds back and marks it `REJECTED`.
  Commission rate and withdrawal minimum are read from `settings`
  (`payments.commission_rate` bps, `payments.withdrawal_min`) via
  `commission_rate_bps()` and inline lookups; defaults are 500 bps / 50,000.
- Cart mutations (`add_to_cart`, `update_cart_item`, `remove_from_cart`) and
  `place_order` are security-definer functions; `place_order` is a single
  transaction that locks products `FOR UPDATE`, validates ACTIVE status and
  stock, decrements stock, snapshots prices server-side, and clears the cart.
- Shipping, returns & disputes also flow through definer functions:
  `ship_order` moves a `PAID` order to `SHIPPED` and records the shipment
  (validates seller ownership and that payment succeeded); `confirm_receipt`
  moves `SHIPPED` → `DELIVERED` → `COMPLETED`. `request_return` validates the
  order is `COMPLETED` and inside the return window (from `returns.window_days`,
  default 30) and opens a `REQUESTED` return. `respond_return` lets the seller
  `APPROVED`/`REJECTED`; an approved return flows to `refund_line`, which
  refunds the buyer's line gross, claws back the seller's `net` via the `REFUND`
  ledger entry, and marks the earning `REFUNDED`. `escalate_dispute` opens a
  dispute on a `REJECTED` return; `resolve_dispute` lets an admin decide it and
  moves the underlying return to `CANCELLED` on rejection.
- Communication writes flow through definer functions too: `notify_user`
  creates an in-app notification after checking `notification_prefs` and
  opportunistically queues an email via `maybe_send_email_notification`
  (pg_net → an Edge Function) when email is enabled in settings.
  `mark_notification_read` / `mark_all_notifications_read` operate on the
  acting user's rows only. `create_or_get_conversation` opens/returns a
  buyer–seller conversation (validating participation); `send_message` writes a
  message, bumps the conversation, and notifies the recipient; `conversation_participant`
  and `conversation_counterpart` enforce who may chat about an order.
- Event-driven triggers call `notify_user` on order status changes (buyer),
  on return status changes (seller on `REQUESTED`, buyer on resolution), and on
  every new dispute (admins).
- Promotions are created/edited by admin definers (`create_voucher`,
  `update_voucher`, `set_voucher_active`, `create_flash_sale`,
  `update_flash_sale`, `set_flash_sale_active`) that require an admin role.
  `validate_voucher` is a read-only helper (returning the computed discount or
  a reason) used for checkout previews. `place_order` is flash-sale and
  voucher-aware: it recomputes each line at the effective flash price via
  `active_flash_price`, optionally validates and applies a voucher code,
  records a redemption, bumps `uses_count`, and persists `discount` +
  `voucher_id` on the order — all in one transaction.
- Reviews are written only through `create_review`/`update_review`
  (`create_review` verifies the order belongs to the acting buyer, is in a
  `DELIVERED`/`COMPLETED` state, contains the product, and is not a duplicate;
  writes are owner-scoped; `set_review_status` lets an owner hide their own
  review or an admin hide/restore any). Follows are a single
  `toggle_store_follow`; wishlists via `create_wishlist`, `rename_wishlist`,
  `delete_wishlist`, `add_to_wishlist` (auto-creating the `Tersimpan` default),
  `remove_from_wishlist` — all owner-scoped security definers. `record_product_view`
  logs anonymously-safe views; `get_recently_viewed` and `get_related_products`
  are read-only helpers for shelves and recommendation foundation.
- Admin & CMS dashboards run through a small set of admin-only definer RPCs for
  operations RLS cannot express: `admin_dashboard_stats` (aggregate KPIs and
  needs-attention counts) and `admin_list_users` (profiles joined with
  `auth.users.email`, since `profiles` never expose email via RLS) require an
  admin role; `admin_set_user_role` is SUPER_ADMIN-only, forbids changing one's
  own role and the last SUPER_ADMIN, and validates roles against a fixed set.
  Everything else an admin page needs reads the tables directly through the
  existing admin RLS (`current_role()` in `('ADMIN','SUPER_ADMIN')`) and
  existing definers (`getWithdrawalsByStatus`, `getOrderById`).
- Analytics aggregates run through store-owner/admin definers because they
  join tables that RLS alone cannot express reliably (committed-order counts,
  revenue recognized per order, and views off the insert-only `product_views`
  log). A shared `__analytics_store_guard` checks the caller owns the store or
  is an admin; `seller_overview` (KPI bundle: orders, units, net revenue,
  views, AOV, conversion, avg rating, reviews), `seller_product_analytics`
  (per-product views/orders/units/net), `seller_sales_series` (zero-filled
  daily revenue + committed orders for charts) and `seller_customer_analytics`
  (buyers, repeat/new buyers, spend) all require that guard.
  `admin_marketplace_analytics` is admin-only and returns GMV, orders, units,
  commission, and buyer/repeat/new-buyer aggregates plus AOV for a window.
  Admin top sellers/products/categories and the daily GMV series are computed
  in the analytics service from the directly-readable `orders`/`order_items`/
  `products`/`stores`/`categories` tables.

RLS is layered on top of, not a replacement for, application-level
authorization.

## Types

Generated types for the schema are written to `src/types/database.ts` and
used to make `@supabase/supabase-js` / `@supabase/ssr` queries type-safe.

## Seed data

Development-specific demo data is defined in `supabase/seed/` (see
`supabase/seed/README.md`). Seed records use clearly-labeled demo
credentials and are never production data.
