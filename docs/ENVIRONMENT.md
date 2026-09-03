# Environment

Environment variables and setup for Warungpedia. Secrets are never committed;
copy `.env.example` to `.env.local` and fill in real values.

## Variables

| Variable | Scope | Required | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Client | dev optional | Canonical app URL (SEO metadata) |
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Yes | Supabase anon (publishable) key |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client | optional | Publishable key alias (see note) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Yes* | Service-role key (**server-only**) |
| `SUPABASE_JWT_SECRET` | Server | per-op | JWT secret for privileged helpers |
| `AI_MODERATION_API_KEY` | Server | later | AI moderation provider |
| `EMAIL_PROVIDER_API_KEY` | Server | later | Email provider |
| `PAYMENT_PROVIDER_SECRET` | Server | later | Payment provider |

\* Required at runtime for server-side privileged/DB operations. Public pages
build without it (the Supabase clients throw only when used without config).

## Client vs server

- Variables prefixed `NEXT_PUBLIC_` are embedded in the browser bundle and
  are safe to be public (Supabase URL, anon key).
- Server-only variables (`SUPABASE_SERVICE_ROLE_KEY`, provider secrets) are
  never prefixed with `NEXT_PUBLIC_` and are never imported from client code.

## Setting up locally

```bash
cp .env.example .env.local
# edit .env.local
```

## Email notifications (optional)

Transactional notification emails are sent by the Edge Function
`supabase/functions/send-notification-email` (Resend), invoked from the
database via pg_net. It is off by default and only requires setup when you
want email delivery:

1. Deploy the function and set its secrets (`supabase functions secrets set`):
   - `RESEND_API_KEY` — Resend API key
   - `RESEND_FROM` — verified sender, e.g. `Warungpedia <noreply@example.com>`
   - `PUBLIC_APP_URL` — base URL used to build notification links
2. Point the database at it (as a super-admin, in the SQL editor):
   ```sql
   update public.settings
   set value = '{"enabled": true}'
   where key = 'notifications.email_enabled';

   update public.settings
   set value = '{"url": "https://<project>.supabase.co/functions/v1/send-notification-email"}'
   where key = 'notifications.email_url';
   ```

## Demo accounts (added per phase)

Development-only demo accounts will be documented here and provided by
`supabase/seed/` as the relevant phases land. They use clearly-labeled demo
credentials and are never used in production.
