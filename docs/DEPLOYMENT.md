# Deployment

Deployment guidance for Warungpedia. Warungpedia targets local development
first and is designed to deploy to **Vercel + Supabase** for open beta,
without tight coupling to Vercel-specific behavior.

> Deployment is intentionally NOT automated. Phase 16 covers the production
> readiness checklist and a controlled rollout; do not deploy until that phase
> is complete and reviewed.

## Target architecture

- **Frontend/backend:** Next.js (App Router) on Vercel (or any Node.js host).
- **Data/backend infra:** Supabase (PostgreSQL, Auth, Storage, Realtime,
  Edge Functions).

## Prerequisites checklist (all checked for Phase 16)

- [x] `.env.local` / runtime env configured (never commit secrets)
- [x] Supabase project linked and migrations pushed (`supabase db push`)
- [x] Supabase Auth providers + email templates configured
- [x] Storage buckets created with RLS policies
- [x] Production build passes (`npm run build`)
- [x] Security audit (RLS, authorization, uploads, webhooks)
- [x] Backup/recovery plan in place
- [x] Monitoring/logging connected (e.g. Sentry-compatible)

## Local preview

```bash
npm run build && npm run start
```

## Notes

- Turbopack is the default builder for `next build`.
- `next lint` is removed in Next.js 16; linting is a separate `npm run lint`
  step, not part of the build.
- Use `remotePatterns` (not `images.domains`) for Next Image external hosts.
- The service-role key is never exposed to the browser.
- Image optimization is configured from `NEXT_PUBLIC_SUPABASE_URL`
  (`next.config.ts` builds a `remotePatterns` host from it, with a
  `*.supabase.co` fallback), so this env var must be present at build time or
  optimized URLs from Supabase Storage will not resolve.
- PWA: the installable manifest (`/manifest.webmanifest`), `icon.svg` and
  `/robots.txt` are static; the dynamic `/sitemap.xml` needs DB access at
  request time. `public/sw.js` is the offline app-shell service worker and is
  only registered in production builds.
