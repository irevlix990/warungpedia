# Testing

Testing strategy for Warungpedia.

## Stack

- **Vitest** for unit and integration tests (jsdom environment, React Testing
  Library for components).
- E2E testing (Playwright/Cypress) is added in a later phase.

## Commands

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run test`         | Run tests once                       |
| `npm run test:watch`   | Run tests in watch mode              |
| `npm run test:coverage`| Run tests with coverage report       |

## Test locations

Tests are colocated with the code they cover:

```text
src/**/*.test.ts        or    src/**/__tests__/*.test.ts
```

Vitest config is in `vitest.config.ts` (alias `@` → `src`, jsdom, setup
file `vitest.setup.ts`).

## Current coverage

Phase 0 introduces unit tests for pure utilities and config; Phase 1 adds
validation and RBAC decision tests; Phase 2 adds catalog and price helpers;
Phase 3 adds slug and store-validation tests; Phase 4 adds product helpers
and product-validation tests; Phase 5 adds search-query-layer tests; Phase 6
adds cart-totals and cart-validation tests; Phase 7 adds commission/net math
and payment/withdrawal validation tests; Phase 8 adds return-window helpers and
shipping/returns/disputes validation tests; Phase 9 adds notification/chat
validation tests; Phase 10 adds promotion discount math and voucher/flash-sale
validation tests; Phase 11 adds review/follow/wishlist validation tests;
Phase 12 adds admin & CMS schema tests; Phase 13 adds analytics period
helpers and range-validation tests; Phase 14 adds SEO/JSON-LD builder tests:

- `src/utils/__tests__/cn.test.ts` — `cn` class merging, `formatIDR`.
- `src/utils/__tests__/catalog.test.ts` — category tree grouping, root/child
  ordering, `hasChildren`.
- `src/utils/__tests__/price.test.ts` — price/discount breakdown (integer
  IDR, original-price derivation, out-of-range discounts).
- `src/utils/__tests__/slugify.test.ts` — slug generation (accents, unsafe
  characters, whitespace collapsing, edge cases).
- `src/utils/__tests__/product.test.ts` — stock-level classifier, thumbnail
  fallback, and integer-IDR price-part derivation with compare-at discount.
- `src/config/__tests__/roles.test.ts` — RBAC roles/permissions & the pure
  `hasPermission` decision, i18n locales.
- `src/lib/validation/__tests__/validation.test.ts` — Zod schemas for
  sign-up/sign-in/password-reset/profile and shipping addresses.
- `src/lib/validation/__tests__/store.test.ts` — store application/settings
  schema (slug format, email, required fields, URL-or-empty).
- `src/lib/validation/__tests__/product.test.ts` — product create/edit schema
  (name/slug format, integer-IDR price, compare-at refinement, stock/weight
  min bounds, condition/status enums, image URL list).
- `src/utils/__tests__/search.test.ts` — search query layer
  (`parseProductSort`, `parsePage`, `paginationOffset`, `totalPages`,
  `PRODUCT_SORTS`) incl. invalid-input fallbacks.
- `src/utils/__tests__/cart.test.ts` — integer-IDR subtotal/total derivation
  from cart lines (`computeSubtotal`, `cartTotals`, `SHIPPING_FEE`).
- `src/lib/validation/__tests__/cart.test.ts` — add/update cart schemas
  (uuid ids, quantity range 1..99, integer enforcement).
- `src/utils/__tests__/finance.test.ts` — commission/net split in integer IDR
  at basis points (`splitEarning`, `earningBreakdown`), flooring, commission
  cap, invalid-rate fallback, formatted labels; return-window helpers
  (`returnWindowEnds`, `canRequestReturn`) incl. window expiry edge cases.
- `src/lib/validation/__tests__/payment.test.ts` — payment method enum and
  withdrawal request schema (amount > 0 integer, digit-only account number),
  withdrawal decision schema.
- `src/lib/validation/__tests__/shipping.test.ts` — ship-order schema
  (tracking required, uuid order id), return-request schema (optional reason/
  note, uuid ids), return-response approve/reject booleans-as-strings, dispute
  escalation (required reason), and admin dispute-resolution schemas.
- `src/lib/validation/__tests__/communication.test.ts` — notification-preferences
  schema (channel + per-type toggles with defaults), mark-notification-read,
  send-message (non-empty body, uuid conversation), and open-conversation schemas.
- `src/utils/__tests__/promotions.test.ts` — `applyFlashDiscount`/
  `flashSalePrice`/`voucherDiscount` (integer IDR, percent flooring, clamp at
  zero, whole-value rejection, percent cap), plus voucher/flash-sale admin
  schemas and the cheap voucher-application schema.
- `src/lib/validation/__tests__/social.test.ts` — review schema (rating 1–5,
  required body, uuid ids, numeric-string coercion), review status
  (ACTIVE/HIDDEN only), create/rename wishlist (non-empty ≤80 name), add
  wishlist item (uuid, optional wishlist id + notes), and follow toggle
  (uuid store id).
- `src/lib/validation/__tests__/admin.test.ts` �?" admin & CMS schemas:
  set-user-role (role enum, uuid user id), product moderation (optional status,
  `featured` checkbox-to-boolean transform, invalid-status rejection), review
  status (ACTIVE/HIDDEN only), category create/edit (required name, slug
  kebab-case format, sortOrder coercion to integer, optional parent/image URL),
  and site settings (required site name, support-email format).
- `src/utils/__tests__/analytics.test.ts` �?" analytics period/date helpers:
  `resolveAnalyticsRange` (start-of-day windows for 7/30/90 days, fallback),
  `dayKey` zero-padding, `seriesOfDays` inclusive ranges, and
  `completeDailySeries` zero-fill across missing days.
- `src/lib/validation/__tests__/analytics.test.ts` �?" analytics range schema
  (valid 7d/30d/90d presets, invalid/missing range rejection).
- `src/lib/seo/__tests__/seo.test.ts` �?" SEO builders: `absoluteUrl`
  (origin/path normalization, root), `makeTitle`, `buildMetadata` (canonical,
  OpenGraph/Twitter, robots noindex), and the JSON-LD builders
  (`organizationJsonLd`, `breadcrumbJsonLd` positions + absolute items,
  `productJsonLd` Offer/aggregateRating/image/brand).- `src/utils/__tests__/finance.extended.test.ts` — extended finance edge cases
  (zero gross, rounding flooring, commission ceiling, invalid rates, return
  window sub-millisecond boundary).
- `src/utils/__tests__/promotions.extended.test.ts` — extended promotion edge
  cases (AMOUNT clamps, 100% percent, max cap enforcement, integer invariants).
- `src/utils/__tests__/cart.extended.test.ts` — extended cart & order total edge
  cases (large quantity integer precision, multi-seller subtotals, zero totals).
- `src/config/__tests__/roles.extended.test.ts` — exhaustive RBAC boundary matrix
  (least privilege across all 4 roles, 15 granular permissions).
- `src/lib/validation/__tests__/security.test.ts` — security input validation
  (UUID/SQL injection, XSS payloads, role escalation, financial float/negative
  tampering, cart quantity boundaries, rating manipulation, dispute length limits).
- `src/__tests__/order-integrity.test.ts` — multi-vendor order calculation flow,
  commission/settlement, wallet invariants, partial/full refund calculation,
  return window boundary.
- `src/__tests__/critical-flows.test.ts` — 3 critical E2E journey simulations
  (buyer journey, return/dispute journey, seller onboarding & settlement).
## Planned test coverage (per phase)

Unit tests for critical business logic:
- Pricing, commission, voucher, wallet, refund, order calculations, inventory,
  return-window validation.

Integration tests for:
- Authentication, database, checkout, payment, webhooks, wallet, orders,
  seller approval, product moderation.

E2E tests for critical user journeys (register → verify → login → browse →
search → product → cart → checkout → payment → order → ship → deliver →
complete → review; plus return/dispute and become-seller flows).

## Quality gates

- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
- `npm run build` — production build
- `npm run test` — Vitest
