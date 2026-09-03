import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Root proxy (Next.js 16 renamed Middleware to Proxy).
 *
 * Responsibilities:
 *   - Refresh the Supabase auth session on supported requests.
 *   - Route-level authorization is performed in Server Components/Server
 *     Actions (server-side), not here, to avoid leaking authz logic into a
 *     single network boundary.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and internal routes.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
