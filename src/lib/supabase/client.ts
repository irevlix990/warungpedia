import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Browser-side Supabase client.
 *
 * Uses the ANON (publishable) key only. Never reference the service-role
 * credential from client code — it is server-only.
 *
 * The URL/key are `NEXT_PUBLIC_` so they are safe to embed in the browser
 * bundle.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
    )
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
