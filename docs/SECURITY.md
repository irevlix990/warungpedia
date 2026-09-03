# Security

Security posture for Warungpedia. This document reflects the implemented
controls; it is updated as phases land and never describes controls that are
not actually in place.

## Principles

1. **The server is authoritative.** The client is never trusted for prices,
   discounts, stock, permissions, roles, payment state, or seller ownership.
2. **Defense in depth.** RBAC (application) + RLS (database) + input &
   business-rule validation + audit logging + secure uploads + rate limiting.
3. **Least privilege.** Service-role credentials and admin capabilities are
   granted only where required.
4. **Auditability.** Important and financial actions are recorded in
   tamper-resistant audit logs.
5. **No secrets in the browser.** The Supabase service-role key and provider
   secrets are server-only.

## Credential separation

See `docs/ENVIRONMENT.md`. Key rules already enforced:

- `NEXT_PUBLIC_*` values (Supabase URL, anon key) are safe for the browser.
- `SUPABASE_SERVICE_ROLE_KEY` and provider secrets are **server-only** and
  imported only by server-side modules (`src/lib/supabase/service-role.ts`).
- `.env*` are git-ignored; `.env.example` documents the required variables
  without secrets.

## Application-layer controls (current)

- **RBAC** with granular admin permissions (`src/config/roles.ts`):
  `BUYER`, `SELLER`, `ADMIN`, `SUPER_ADMIN` and permissions such as
  `MANAGE_ORDERS`, `MANAGE_REFUNDS`, `VERIFY_SELLERS`, ... Decisions go
  through the pure `hasPermission(role, permission)` helper.
- **Data Access Layer** (`src/lib/auth/dal.ts`): request-scoped identity +
  role resolution (`getCurrentUser`), plus guards used by every protected
  Server Component / Server Action / Route Handler: `requireUser`,
  `requireUserOrThrow`, `requireRole`, `requirePermission`, and convenience
  guards (`requireAdmin`, `requireSeller`, ...).
- **Server-side schema validation** with Zod (`src/lib/validation/`) on all
  auth and address mutations before any provider/DB call.
- **RLS** is enabled on `profiles`, `addresses`, and `settings`
  (`002_auth_profiles.sql`): owner-scoped reads/writes, admin elevation for
  management roles, and no direct `profiles` inserts (trigger-managed).
- **Credential separation** as described in `docs/ENVIRONMENT.md`.

## Controls implemented per phase

### Phase 1–14 (Application)
- **RBAC** with granular admin permissions (`src/config/roles.ts`):
  `BUYER`, `SELLER`, `ADMIN`, `SUPER_ADMIN` and 15 granular permissions.
  Decisions go through the pure `hasPermission(role, permission)` helper.
- **Data Access Layer** (`src/lib/auth/dal.ts`): request-scoped identity +
  role resolution, plus `requireUser`, `requirePermission`, `requireAdmin`,
  `requireSeller` convenience guards.
- **Server-side schema validation** with Zod (`src/lib/validation/`) on all
  mutations before any provider/DB call.
- **RLS** enabled on `profiles`, `addresses`, and `settings`
  (`002_auth_profiles.sql`): owner-scoped reads/writes, admin elevation,
  no direct `profiles` inserts.
- **Credential separation**: `NEXT_PUBLIC_*` (browser), service-role (server-only).
- **Audit logging** for all money movement, admin actions, and important state changes.

### Phase 15 (Comprehensive Testing & Security Audit)
- **UUID/SQL injection tests**: all UUID-accepting inputs validated against injection patterns.
- **XSS payload tests**: user-facing fields reject `<script>` tags and oversized strings.
- **Privilege escalation tests**: role assignment restricted to exactly 4 valid roles.
- **Financial tampering tests**: negative, zero, and float money amounts rejected.
- **Cart manipulation tests**: quantity bounds 1–99, integer-only enforcement.
- **Review rating manipulation**: float ratings rejected, bounds 1–5 enforced.
- **Payment method enumeration**: unknown methods rejected server-side.
- **Dispute escalation DoS**: empty and oversized reasons rejected.
- **Exhaustive RBAC matrix**: 4 roles × 15 permissions tested for least-privilege.
- **3 Critical E2E journey simulations**: buyer, return/dispute, seller onboarding.
- **Order/financial integrity tests**: commission floor, settlement, wallet invariants, refund proportional reversal.
- **Return window boundary tests**: sub-millisecond expiry precision.
- **327 tests across 29 test files — all passing**.

### Phase 16 (Production Readiness)
- **Audit logging** documented for all critical actions.
- **Confidential error messages**: `error.tsx` and `global-error.tsx` log details server-side; user sees friendly Indonesian message only.
- **PWA ready**: installable manifest, offline-friendly service worker.
- **SEO complete**: structured data, sitemap, robots.txt, canonical URLs, OpenGraph.
- **Monitoring-ready architecture**: error pages log `console.error` compatible with Sentry; structured logging ready for external services.
- **Documentation complete**: ARCHITECTURE.md, DATABASE.md, DEPLOYMENT.md, ENVIRONMENT.md, SECURITY.md, TESTING.md reflect the actual implementation.

## Operational notes

- Never commit real secrets.
- The service-role key must never appear in client bundles or `NEXT_PUBLIC_`.
- Audit logs must be tamper-resistant within the application's
  authorization model and never destructively deleted.
