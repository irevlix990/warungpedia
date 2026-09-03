# Architecture

This document describes the current architecture of Warungpedia (Phase 16 —
Production readiness on top of comprehensive testing & security audit,
SEO/PWA/performance, analytics, admin/CMS, reviews/wishlist/social, promotions,
communication, shipping/returns, and the financial system). It is updated as
phases land; it never describes functionality that does not exist yet.

## Overview

Warungpedia is a Next.js 16 (App Router) application backed by Supabase. The
architecture is feature-oriented, with the server authoritative for all
business rules, money, and authorization. The client renders and collects
input only.

```
Browser
  │  (Server Components / Server Actions / Route Handlers)
  ▼
Next.js Server (App Router, Turbopack)
  │  server-side services (src/services)
  │  server-only Supabase client (service role) for privileged ops
  │  request-scoped Supabase client (anon key + session cookie) for RLS
  ▼
Supabase
  ├── PostgreSQL (RLS enforced per row)
  ├── Auth (email/password, OAuth, verification, reset)
  ├── Storage (public + private buckets)
  ├── Realtime (chat, presence)
  └── Edge Functions (AI moderation, webhooks, etc.)
```

## Directory layout

```text
src/
├── app/            # Routes; layout.tsx, page.tsx, route handlers, proxy.ts
│   ├── actions/    # Server Actions (auth, profile, store, product, cart) — mutations
│   ├── auth/       # Sign in, sign up, verify, reset, callbacks
│   ├── account/    # Profile & addresses (requires auth)
│   ├── categories/ # Catalog browsing (all categories)
│   ├── category/   # [slug] — a single category + its subcategories
│   ├── search/     # Product & store search (`?q=`, category/sort/page)
│   ├── cart/       # Shopping cart (requires auth)
│   ├── checkout/   # Order confirmation + place order (requires auth)
│   ├── orders/     # Order list (`/orders`) + detail `/orders/[id]`
│   ├── seller/     # Seller dashboard, apply, status, store settings, products, finances
│   ├── admin/      # Admin dashboard + store review queue + withdrawal approvals
│   └── store/      # [slug] storefront, /product/[productSlug] detail
├── components/
│   ├── features/   # Feature groups (auth, account, catalog, seller, shop, admin, search, cart, payment)
│   ├── layout/     # Global shell (header, user menu, footer, logo, search)
│   ├── providers/  # Client providers mounted once (ThemeProvider)
│   └── ui/         # Reusable design-system primitives
├── config/         # Static config: roles/permissions, i18n, site
├── features/       # Feature-scoped modules (added per phase)
├── hooks/          # Shared React hooks
├── lib/
│   ├── auth/       # Data Access Layer (identity + RBAC guards)
│   ├── i18n/       # Typed translation dictionaries (id, en)
│   ├── supabase/   # Supabase client factories
│   └── validation/ # Zod schemas (auth, address, store, product, cart, payment)
├── services/       # Server services (auth, profile, catalog, store, product, cart, payment)
├── styles/         # Global CSS + Tailwind v4 design tokens
├── types/          # Shared types + generated database types
└── utils/          # Pure helpers (cn, formatIDR, catalog, price, product, slugify)

supabase/
├── migrations/     # Versioned SQL migrations (single source of schema truth)
├── seed/           # Development/demo data (entry: supabase/seed.sql)
└── functions/      # Edge Functions (later phases)
```

## Key conventions

- **Money is integer IDR**, calculated only on the server, and auditable
  via the financial ledger (added in Phase 7).
- **The server is authoritative.** Client-provided price/stock/voucher/
  permission/payment-state values are never trusted.
- **RBAC + RLS.** Roles and granular admin permissions are defined in
  `src/config/roles.ts`. Database Row Level Security (RLS) is layered on top
  of server-side authorization — never a replacement for it.
- **Business rules in services.** Critical logic lives in server services /
  Server Actions / DB constraints, not in React components.
- **i18n.** User-facing strings use typed dictionaries (`id` default, `en`);
  strings are not hardcoded in components.

## Supabase clients

| File                               | Scope      | Key          | Purpose                          |
| ---------------------------------- | ---------- | ------------ | -------------------------------- |
| `src/lib/supabase/client.ts`       | Browser    | anon         | SSO / interactive client        |
| `src/lib/supabase/server.ts`       | Server     | anon + cookie| Request-scoped, RLS-aware client |
| `src/lib/supabase/service-role.ts` | Server-only| service role | Privileged server operations     |
| `src/lib/supabase/middleware.ts`   | Proxy      | anon         | Session refresh (used by proxy)  |

The service-role key is never exported to the browser.

## Authentication & authorization

Auth flows run through Supabase Auth via request-scoped clients:

- **Server Actions** (`src/app/actions/`) validate input with Zod, call the
  auth/profile services, and redirect. Identity/RBAC is enforced by the DAL
  in each action (`requireUserOrThrow`, `requirePermission`).
- **DAL** (`src/lib/auth/dal.ts`) memoizes per-request identity+role lookup
  (`getCurrentUser`) and exposes `requireUser`, `requireRole`,
  `requirePermission`, and conveniences.
- **Proxy** only refreshes the Supabase session cookie (optimistic auth);
  authorization decisions are made server-side, not in the network boundary.
- **OAuth/email-link callback** (`/auth/callback`) exchanges the code/token
  for a session before redirecting.
- Roles bind to `profiles.role`; the `current_role()` DB function drives RLS.

## Marketplace shell & catalog

- **Shell.** The root layout renders `Header` + `Footer`. The account menu is
  the only session-dependent fragment; it is wrapped in `Suspense` so the
  cookie read never blocks first paint of the shell.
- **Catalog service** (`src/services/catalog-service.ts`, `server-only`,
  React-`cache()`d) is the only read path for the public taxonomy. Pages
  catch service failures and surface an `EmptyState` — the app renders real
  DB rows, never mock data, and degrades gracefully when the database is
  unavailable.
- **Catalog UI** (`src/components/features/catalog/`) renders `categories`
  into cards across the home page, `/categories`, `/category/[slug]`, and
  `/search`. Category hierarchy helpers (`src/utils/catalog.ts`) are pure and
  unit-tested; price display utilities (`src/utils/price.ts`) are pure,
  integer-IDR safe, and prepared for the product phases.
- **Search.** `/search` (params `q`, `cat`, `sort`, `page`) searches products
  and stores. See "Search & discovery" below.

## Seller system

- **Lifecycle.** A store starts as `PENDING`, is reviewed by an admin, and
  becomes `ACTIVE`, `REJECTED` (with a reason), or — later — `SUSPENDED` /
  `CLOSED`. `approve_store` also elevates the owner's role from `BUYER` to
  `SELLER`.
- **Write path is authority-safe.** All store mutations flow through
  security-definer PostgreSQL functions (`create_store_application`,
  `update_store`, `resubmit_store`, `approve_store`, `reject_store`, …). This
  prevents an owner from self-approving: RLS blocks the owner from setting
  status to `ACTIVE`, and only the admin definer functions can. The owner
  edit policy (`with check (status = 'PENDING')`) is defense-in-depth only.
- **Read path.** `src/services/store-service.ts` (server-only) maps `stores`
  rows to `Store` DTOs. The public storefront (`getStoreBySlug`) reads only
  `ACTIVE` stores via RLS. `getStoreByOwner` is RLS-scoped to the acting
  user's own row (any status); `getStoresByStatus` feeds the admin queue.
- **Authorization.** Owner-side actions require `MANAGE_STORE` (granted to
  `SELLER`, `ADMIN`, `SUPER_ADMIN`); admin review requires `VERIFY_SELLERS`
  (granted to `ADMIN`, `SUPER_ADMIN`). Guards come from the DAL in each
  Server Action.
- **Routes.** `/seller/{apply,status,store}` handle application, status
  (with resubmit), and ACTIVE store settings. `/admin/stores` is the pending
  review queue with approve/reject + rejection reason. `/store/[slug]` is the
  public storefront (404 on missing/inactive).
- **Validation/slug.** `src/lib/validation/store.ts` (Zod) validates
  submissions; optional explicit slug or auto-derived by
  `src/utils/slugify.ts` (pure, unit-tested).

## Product & inventory

- **Ownership & lifecycle.** A product belongs to one `store` (a store-scoped
  unique `slug`), optionally a `category`, and moves through
  `DRAFT → ACTIVE → ARCHIVED`. Only products in an ACTIVE store with status
  `ACTIVE` are publicly visible (enforced in RLS **and** in the read
  service). Sellers publish their own products; a non-ACTIVE store cannot
  publish.
- **Money stays integer IDR.** `price`/`compare_at_price` are integers with a
  DB check that `compare_at_price > price`. Display-only discount derivation
  lives in `src/utils/product.ts` (`productPriceParts`) and reuses the
  integer-IDR `formatIDR`/`computePriceBreakdown` utilities.
- **Stock.** `stock` + `low_stock_threshold` drive a pure `stockLevel()`
  classifier (`out`/`low`/`in`) used for badges on cards, the storefront, and
  the seller table. Stock is set via `set_product_stock` (owner/admin).
- **Write path is authority-safe.** All mutations go through security-definer
  functions: `create_product`, `update_product`, `set_product_status`,
  `set_product_stock`, `delete_product`. Sellers can only delete
  `DRAFT`/`ARCHIVED` (active products must be archived first); admins may
  moderate any product.
- **Server actions** (`src/app/actions/product.ts`) validate with the Zod
  `productSchema` (`src/lib/validation/product.ts`) and route through the
  product service. Owner actions require `MANAGE_STORE`.
- **Seller UI.** `/seller/products` (list with publish/archive/delete and
  stock badges), `/seller/products/new`, `/seller/products/[id]` (create/edit
  form with category picker and image URL list).
- **Public storefront.** `/store/[slug]` lists the store's ACTIVE products as
  cards; `/store/[slug]/product/[productSlug]` is the product detail page
  (404 on inactive store/product). Out-of-stock is surfaced as a badge.

## Search & discovery

- **Unified product search.** `searchProducts` (`src/services/product-service.ts`)
  searches all ACTIVE products in ACTIVE stores by keyword across
  name/brand/description (ILIKE), with an optional category filter, a
  whitelisted sort set, and offset/limit pagination. It performs a two-step
  query (products, then the owning stores by ID) so results carry
  `storeSlug`/`storeName` for deep links to `/store/{storeSlug}/product/{productSlug}`.
- **Search query layer.** Pure helpers in `src/utils/search.ts`
  (`parseProductSort`, `parsePage`, `paginationOffset`, `totalPages`,
  `PRODUCT_SORTS`, `SEARCH_PAGE_SIZE=24`) keep the page/server code trivial and
  are fully unit-tested.
- **Results page.** `/search` (params `q`, `cat`, `sort`, `page`) surfaces
  matching **stores** (`searchActiveStores` in `src/services/store-service.ts`,
  name/tagline match, limit 8) plus a **product** grid with a category filter,
  a sort dropdown (`src/components/features/search/search-controls.tsx`), and
  pagination (`search-pagination.tsx`). The header search form routes here.
- **Category discovery.** `/category/[slug]` now lists the category's ACTIVE
  products in addition to its subcategories, so browsing acts as discovery.
- **Store search.** `searchActiveStores` matches ACTIVE store name/tagline with
  a capped result set, used by the search page.

## Cart & checkout

- **Cart model.** One `carts` row per buyer with `cart_items` lines
  (`cart_id` + `product_id` unique). Cart mutations are security-definer
  functions (`add_to_cart`, `update_cart_item`, `remove_from_cart`) that
  validate the product is purchasable (ACTIVE product in an ACTIVE store) and
  clamp quantity to 1..99.
- **Cart read.** `getCartForUser` (`src/services/cart-service.ts`) joins the
  cart lines to current ACTIVE products and their store slugs, computing an
  integer subtotal via pure helpers in `src/utils/cart.ts`
  (`computeSubtotal`, `cartTotals`, `SHIPPING_FEE`).
- **Checkout is atomic and server-authoritative.** `place_order` is a single
  security-definer transaction: it locks product rows `FOR UPDATE`, re-verifies
  ACTIVE status, rejects insufficient stock, decrements stock, snapshots
  name/price/weight into `order_items`, computes `subtotal`/`total` server-side
  in integer IDR, and clears the cart. The client never supplies money figures.
- **Order snapshots.** `order_items` keep a historical record (`product_name`,
  `product_price`, `store_id`) so a sold order remains intact even if the
  product is later edited or deleted.
- **Server actions** (`src/app/actions/cart.ts`): add-to-cart (returning a
  stateful result), quantity update, remove, and `checkoutAction` which
  redirects to `/orders/{id}` on success or back to `/cart?error=checkout`.
- **Routes.** `/cart` (list + totals), `/checkout` (confirm + place order),
  `/orders` (list), `/orders/[id]` (confirmation/summary). The product detail
  page gains an "Add to Cart" control (`add-to-cart-button.tsx`).
- **Auth gating.** Cart/checkout/orders pages redirect anonymous users to sign
  in with a `next` return path. RLS keeps reads scoped to the buyer.

## Payments & financial ledger

- **Money is integer IDR and server-authoritative.** Financial operations live
  in security-definer functions (`pay_order`, wallet helpers, withdrawal
  functions) that never trust client-supplied prices. Pure helpers in
  `src/utils/finance.ts` (`splitEarning`, `earningBreakdown`) compute commission
  and net; the commission rate and withdrawal minimum come from `settings`.
- **Ledger-based bookkeeping.** `ledger_entries` is an append-only record of
  every wallet movement (`SALE/COMMISSION/WITHDRAWAL/PAYMENT/REFUND/ADJUSTMENT`)
  with `balance_after` for reconciliation; mutable balances are a projection.
- **Recognition of earnings.** `pay_order` atomically marks an order `PAID`
  and recognizes per-line `seller_earnings` (gross, commission, net) credited
  to the seller wallet via `credit_wallet`. Withdrawals reserve funds immediately
  (`request_withdrawal`) and return them on rejection.
- **Server actions & services.** `src/services/payment-service.ts` +
  `src/app/actions/payment.ts` expose pay/withdraw flows; seller finances and
  admin withdrawal approval/rejection are dedicated pages. `PayOrderForm` wraps
  the pay action.
- **Routes.** `/seller/finances` (balance, ledger, withdrawals),
  `/admin/withdrawals` (approve/reject), plus pay UI on `/orders/[id]`.
  Business rules (minimums, commission) are enforced server-side.

## Shipping, returns & disputes

- **Order lifecycle.** `ship_order` (seller-owned) moves a `PAID` order to
  `SHIPPED` and writes a `shipments` tracking row (carrier + tracking number).
  `confirm_receipt` (buyer) advances `SHIPPED → DELIVERED → COMPLETED`. RLS
  exposes orders and their shipments to the order's buyer, its seller, and
  admins.
- **Returns are per-line.** `request_return` validates the order is `COMPLETED`
  and inside the configured window (`returns.window_days`, default 30 from
  `src/utils/finance.ts`), opening a `REQUESTED` return with an optional seeded
  `return_reasons` reason. `respond_return` lets the seller `APPROVED`/`REJECTED`;
  an approval routes to `refund_line`, which refunds the buyer the line gross,
  claws back the seller `net` via a `REFUND` ledger entry, and marks the earning
  `REFUNDED`.
- **Disputes.** A buyer can `escalate_dispute` a rejected return; admins decide
  via `resolve_dispute` (`OPEN → APPROVED/REJECTED → CLOSED`), moving the
  underlying return to `CANCELLED` when rejected.
- **Service & validation.** `src/services/shipping-service.ts` (reads via
  `getReturnReasons`, `getSellerOrders`, `getReturnsForOrder`, etc.) and
  `src/lib/validation/shipping.ts` (zod schemas) back the server actions in
  `src/app/actions/shipping.ts`.
- **Routes.** Buyer `/orders/[id]` gains confirm-receipt, shipment tracking, and
  per-line return forms; seller gets `/seller/orders`, `/seller/orders/[id]`,
  and `/seller/returns`; admin gets `/admin/disputes`.

## Communication & notifications

- **In-app notifications.** `notify_user` (security definer) creates a
  `notifications` row after honoring `profiles.notification_prefs`
  (`{ email, push, types }`). Reads are RLS-scoped to the owner + admins; only
  definers write. `services/communication-service.ts` +
  `app/actions/communication.ts` back an inbox at `/notifications` with an
  unread badge in the global header (`notification-bell.tsx`).
- **Preferences.** `/account/preferences` edits channel + per-type toggles via
  `notificationPrefsSchema`, stored as JSONB on the profile.
- **Email (optional).** `notify_user` fans email out through
  `maybe_send_email_notification`, which uses pg_net to POST a payload to the
  Edge Function `send-notification-email` (Resend) when `notifications.email_enabled`
  is on and a URL is configured. Delivery is best-effort and never blocks the
  notification write.
- **Buyer–seller chat.** Order-scoped `conversations` + `messages`, created and
  written only by definers that validate participation (buyer or the order's
  seller). `send_message` persists the message, bumps `last_message_at`, and
  notifies the recipient. `/chat` lists conversations with unread counts,
  `/chat/[id]` is the thread with a live composer; an "Open chat" button is
  wired into the buyer order page.
- **Event-driven.** Triggers on `orders`, `returns`, and `disputes` call
  `notify_user` for high-value transitions (status changes, new return, new
  dispute), so notifications arise from the database rather than scattered
  call-sites.

## Promotions

- **Vouchers.** Admin-created discount codes (`create_voucher`/`update_voucher`),
  percent or fixed amount, with a min-spend, validity window, per-user and
  total usage limits (bounded by `user_voucher_redemptions` + `uses_count`).
  The buyer enters one code at checkout; `place_order` validates it server-side
  (RLS makes `vouchers` admin-only, so the client never reads voucher rows),
  computes the discount, records a redemption, and drops `orders.discount`/`voucher_id`.
  A lightweight `validate_voucher` RPC drives a checkout preview via
  `applyVoucherPreviewAction`, but the authoritative application is `place_order`.
- **Flash sales.** Admin-scheduled per-product, time-limited discounts. Display
  is CDN-safe: `/search` and the cart overlay the sale price from the shared
  `flashSalePrice` helper, so buyers see the price they will pay. `place_order`
  recomputes every line price from `active_flash_price`, making the snapshot
  price authoritative regardless of stale client display.
- **Money.** Discounts are integer IDR and floor-rounded for percent, identical
  in the display helper and SQL. Voucher discounts are borne by the marketplace
  (they reduce the payable `total` but do not change per-line gross/commission,
  which derive from item price snapshots); flash sales lower the item price and
  thus the seller's gross/commission accordingly.
- **Admin UI.** `/admin/vouchers` (+ `/admin/vouchers/[id]`) and
  `/admin/flash-sales` give admins list/create/edit/toggle controls, linked from
  the admin shell. Buyer checkout includes the voucher field + preview, and the
  order confirmation shows the applied discount.

## Reviews, wishlist & social commerce

- **Reviews & ratings.** A buyer may write one review per product only after a
  `DELIVERED`/`COMPLETED` order containing it (`create_review` verifies
  ownership and status server-side; direct client writes are blocked by RLS).
  Reviews snapshot `author_name` (profiles are private) and support a
  moderation `HIDDEN` status (owner hides own, admin restores). Aggregates are
  denormalized onto `products` and `stores` by the `sync_review_aggregates`
  trigger, so cards and pages read ratings without per-request aggregation.
- **Store following.** `toggle_store_follow` is a single atomic definer;
  `StoreFollowButton` toggles from the product page and `/following` lists
  followed stores with name/logo/rating.
- **Wishlists.** Named collections (`wishlists`) + `wishlist_items`. A default
  `Tersimpan` collection is auto-created on first add. `AddToWishlistButton`
  toggles from the product page; `/wishlist` lists collections and
  `/wishlist/[id]` shows items with notes, rename, and remove controls.
- **Product views / recently viewed.** `RecordProductView` (a client
  component) calls `record_product_view` once per page view, logging
  user_id-nullable rows into `product_views`. `get_recently_viewed` powers the
  signed-in home shelf. `product_views` is the **recommendation foundation**: a
  raw interaction log later phases can mine for collaborative filtering /
  personalized recommendations.
- **Related products.** `get_related_products` (same-category ACTIVE siblings,
  sorted by rating then reviews) feeds the product-page shelf, rendered through
  the same `ProductCard` as search. Product cards now show rating stars
  (`RatingStars`) and review counts.
- **Client/social UI.** New `social/` feature components: `rating-stars`,
  `add-to-wishlist-button`, `store-follow-button`, `unfollow-button`,
  `review-form`, `reviews-section`, `product-shelf`, `record-view`,
  `create-wishlist-form`, `wishlist-settings`, `remove-from-wishlist-button`.
  Wishlist + Following links were added to the header `UserMenu`.

## Admin & CMS

- **Shell & nav.** The `/admin` area is gated by `requireAdmin()` in its layout
  and wrapped in a client `AdminNav` (`src/components/features/admin/admin-nav.tsx`)
  with `usePathname` active highlighting across six groups — Overview,
  Marketplace, Commerce, Finance, Users, CMS.
- **Server-authoritative reads.** Because admin RLS already lets
  `('ADMIN','SUPER_ADMIN')` read `categories`, `products`, `profiles`,
  `settings`, `orders`, `order_items`, `stores`, `vouchers`, `returns` and
  `disputes` directly, most admin pages read tables straight through the typed
  client (`admin-service.ts`), guarded by `requirePermission(...)` /
  `requireSuperAdmin()`. Pre-existing financial/order/withdrawal pages reuse the
  existing payment/cart services (`getWithdrawalsByStatus`, `getOrderById`).
- **Definer RPCs** add only what RLS cannot express:
  - `admin_dashboard_stats()` — the KPI + needs-attention dashboard, returning
    aggregate counts and sums (users, stores, products, orders, GMV,
    pending withdrawals, open disputes, pending returns, hidden reviews).
  - `admin_list_users()` — joins `auth.users.email` onto `profiles` (profiles
    never expose email under RLS) for the user directory.
  - `admin_set_user_role()` — SUPER_ADMIN-only role elevation that forbids
    changing one's own role and cannot demote the last SUPER_ADMIN.
  These adopt the `security definer set search_path = public` + `current_role()`
  guard pattern from the 010/011 migrations.
- **Actions.** Server Actions live in `app/actions/admin.ts`: role changes,
  product `status`/`featured` moderation, review hide/restore, category
  create/edit + active toggle, and site-setting upserts (`saveSiteSettingsAction`,
  `settingUpsertAction`). All validate with Zod (`lib/validation/admin.ts`),
  enforce permissions, and `revalidatePath` the touched pages (`/admin/*`,
  `/search`, product routes).
- **CMS.** `/admin/cms` renders a site-settings form (site name, tagline,
  support email, about) via `getPublicSiteSettings` plus a generic
  key/value settings list and upsert form; these map to `public.settings`
  (JSONB) with admin-write RLS. Reused by `app_get_setting`/`app_setting`.

## Analytics

- **Surfaces.** Two new dashboards: `/seller/analytics` (store owner) and
  `/admin/analytics` (admin). Both read a `?range=7d|30d|90d` query param
  validated by `analyticsRangeSchema` (`lib/validation/analytics.ts`) and
  resolved by the pure helpers in `utils/analytics.ts`
  (`resolveAnalyticsRange`, `dayKey`, `seriesOfDays`, `completeDailySeries`
  for zero-filled daily series). A client `RangeSelect` re-navigates the page,
  and the server re-reads `searchParams` (async in Next 16).
- **Server-authoritative aggregation.** `services/analytics-service.ts` is the
  single analytics read API:
  - Seller — `getSellerOverview` (orders, units, net revenue, views, AOV,
    conversion, avg rating, reviews), `getSellerSalesSeries` (daily revenue
    chart), `getSellerProductAnalytics`, `getSellerCustomerAnalytics`
    (buyers, repeat/new buyers, spend).
  - Admin — `getAdminMarketplaceKpis` (GMV, orders, units, commission, buyer
    aggregates, AOV), `getAdminSalesSeries` (daily GMV chart),
    `getAdminTopSellers` / `getAdminTopProducts` / `getAdminTopCategories`
    (window-scoped, computed from `order_items` + order/store/category joins),
    `getAdminCustomerAnalytics`.
- **Definer RPCs** (`013_analytics.sql`) are used where RLS direct reads cannot
  express the aggregate reliably: `seller_overview`,
  `seller_product_analytics` (needs the insert-only `product_views` log),
  `seller_sales_series`, `seller_customer_analytics` (needs `orders.user_id`),
  and `admin_marketplace_analytics`. Seller definers share a
  `__analytics_store_guard` (owner or admin) and all use the standard
  `security definer set search_path = public` + `current_role()` pattern.
- **Charts & UI.** Recharts (client-only `AreaChart` in
  `components/features/analytics/line-trend.tsx`) renders the money/count
  trends; `ranks` use the presentational `RankList`. A reusable `KpiCard` was
  added to `src/components/ui/` (exported via the barrel) for KPI tiles. The
  admin nav gained an Analytics group; the seller nav gained an Analytics link
  (active store only).
- **`returns table` quirk.** RPCs declared `returns table(...)` are typed as a
  single row but returned as an array at runtime, so `analytics-service.ts`
  normalizes with `rowOrFirst`/`rowsOf` helpers. The same fix was applied to
  the pre-existing `getAdminStats` (Phase 12), which previously read a single
  row directly.

## SEO, PWA & performance

- **Metadata & OG.** The root layout (`app/layout.tsx`) now ships full
  `Metadata` (OpenGraph, Twitter card, robots + `googleBot`, keywords/authors,
  canonical, `manifest`, icons, `appleWebApp`, `formatDetection`) and a
  `viewport.themeColor`. A shared builder in `lib/seo/seo.ts`
  (`buildMetadata`, `absoluteUrl`, `makeTitle`) keeps every page's canonical /
  OG / Twitter / robots consistent, and `generateMetadata` now powers the three
  previously-untitled public routes: home (`app/page.tsx`), storefront
  (`app/store/[slug]`) and product detail (`app/store/[slug]/product/[productSlug]`).
  Titles rely on the root `%s · Warungpedia` template; dashboard pages that
  used to append `| Warungpedia` explicitly were de-duplicated.
- **Structured data.** Pure JSON-LD builders (`organizationJsonLd`,
  `breadcrumbJsonLd`, `productJsonLd`) emit schema.org Organization, BreadcrumbList
  and Product markup, rendered through the server `<JsonLd>` component on the
  home, store and product pages. Builders are unit-tested in
  `lib/seo/__tests__/seo.test.ts`.
- **Sitemap & robots.** `app/sitemap.ts` aggregates static routes plus active
  categories/stores and their active products (via `services/seo-service.ts`,
  which chunks `store_id` queries past Supabase's `in` limit); `app/robots.ts`
  blocks private/account surfaces and references the sitemap.
- **PWA.** `app/manifest.webmanifest` (via `app/manifest.ts`), a brand
  `app/icon.svg`, and `appleWebApp` metadata make the site installable. A
  dependency-free `public/sw.js` (app-shell precache + network-first
  navigations + stale-while-revalidate static assets) is registered in
  production by `ServiceWorkerRegister` inside `RootProviders`.
- **Image optimization.** `next.config.ts` configures
  `images.remotePatterns` (from `NEXT_PUBLIC_SUPABASE_URL`, plus a `*.supabase.co`
  fallback) and `images.formats` (avif/webp). The store banner/logo raw
  `<img>` were converted to `next/image` (`fill` + `sizes` + `priority` on the
  banner); product images already used `next/image`. Security headers
  (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`) are applied via `next.config` headers.
- **Caching.** Cache-tag constants live in `config/cache-tags.ts` and mutations
  purge them (`revalidateTag(tag, 'max')`) alongside the existing
  `revalidatePath` calls in the admin/product/store Server Actions. Reads
  already deduplicate per request via React `cache()`. Cross-request whole-data
  caching (Next `cacheComponents`/`use cache`) is intentionally **deferred**
  pending live-DB validation, because the in-house Supabase server client reads
  request cookies and caching those reads cross-request could not be
  runtime-validated in this environment.

## Next.js 16 notes

- Middleware is `src/proxy.ts` (function `proxy`).
- `cookies()`, `headers()`, `params`, `searchParams` are async.
- `next lint` is removed; lint via `npm run lint` (ESLint flat config).
- `next build` uses Turbopack by default and does not lint.

## Testing & quality gates

- Unit/integration: Vitest (`npm run test`).
- Lint: `npm run lint`.
- Types: `npm run typecheck`.
- Production build: `npm run build` (run before finishing a phase).
