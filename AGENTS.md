<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Warungpedia — project conventions

Warungpedia is a production-oriented multi-vendor Indonesian marketplace.
Follow the full spec in `README.md`. Read it before making changes.

## Stack

- Next.js 16 (App Router, Turbopack default) + React 19 + TypeScript + Tailwind CSS 4.
- Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions).
- Testing: Vitest (unit + integration). E2E added in a later phase.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (run before finishing a phase)
- `npm run lint` — ESLint (flat config; `next lint` was removed in Next 16)
- `npm run typecheck` — `tsc --noEmit`
- `npm run test` — run Vitest once

## Key Next.js 16 differences (read the docs in `node_modules/next/dist/docs/`)

- `next lint` is REMOVED; use `eslint .`. `next build` does not lint.
- `params`, `searchParams`, `cookies()`, `headers()` are async (Promises).
- Middleware is renamed to `proxy` (file `src/proxy.ts`, function `proxy`).
- `revalidateTag` requires a second arg (a cacheLife profile).
- `next/image`: `images.qualities` defaults to `[75]`; use `remotePatterns`.
- Use async `PageProps`/`LayoutProps` type helpers from `next`.
- Ignore `@next` docs block above; it is managed by `next dev`.

## Architecture

- Feature-oriented structure under `src/`: `app/`, `components/`, `features/`,
  `lib/`, `services/`, `hooks/`, `utils/`, `types/`, `config/`, `styles/`.
- Server is authoritative: never trust client price/stock/vouchers/permissions.
- Money (IDR) is integer, never float; financial ops run server-side.
- Business rules live in server services / Server Actions / DB, not in React
  components.
- RBAC roles: BUYER, SELLER, ADMIN, SUPER_ADMIN (`src/config/roles.ts`).
- i18n: locales `id` (default) and `en` via typed dictionaries
  (`src/lib/i18n/`).
- Theme: light/dark/system via `ThemeProvider` (`src/components/providers/`).
- Design tokens in `src/styles/globals.css` (`@theme`, brand palette).

## Phase protocol

Build in fixed phases (see Master Prompt / README). After each phase, stop
and wait for the user to say "continue" or "lanjutkan". Do not skip phases.
Do not silently change important architectural decisions.
