/**
 * Authentication Data Access Layer (DAL).
 *
 * Centralizes identity + authorization checks so every data request, Server
 * Action, and Server Component guards itself in one place. The `cache()`
 * wrapper memoizes results within a single render pass to avoid duplicate
 * queries. All functions are server-only.
 */
import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuthenticationRequiredError, UnauthorizedError } from '@/lib/errors'
import {
  hasPermission,
  type Role,
  type Permission,
} from '@/config/roles'

/** Auth identity merged with the user's profile role. */
export interface AuthUser {
  id: string
  email: string | null
  fullName: string
  avatarUrl: string | null
  role: Role
  emailVerified: boolean | null
}

/**
 * Resolves the current authenticated user together with their profile role,
 * or null when there is no session. Memoized per render pass.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role, email_verified')
    .eq('id', user.id)
    .maybeSingle()

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? '',
    avatarUrl:
      profile?.avatar_url ??
      (typeof user.user_metadata?.avatar_url === 'string'
        ? user.user_metadata.avatar_url
        : null),
    role: (profile?.role as Role) ?? 'BUYER',
    emailVerified: profile?.email_verified ?? null,
  }
})

/**
 * Returns the current user, redirecting to the sign-in page when there is no
 * session. Use in protected pages/layouts via Server Components.
 */
export const requireUser = cache(async (): Promise<AuthUser> => {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }
  return user
})

/**
 * Returns the current user, throwing when there is no session. Use in Server
 * Actions / Route Handlers where a redirect is not appropriate.
 */
export async function requireUserOrThrow(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthenticationRequiredError()
  }
  return user
}

/**
 * Guards a function by role. Throws when the session is missing or the user's
 * role does not match. Returns the user so the caller can use it.
 */
export async function requireRole(...roles: Role[]): Promise<AuthUser> {
  const user = await requireUserOrThrow()
  if (!roles.includes(user.role)) {
    throw new UnauthorizedError()
  }
  return user
}

/**
 * Guards a function by permission. Resolves the user's role, combines the
 * role's implicit permissions with any explicit per-user permissions, and
 * throws if the permission is not granted.
 */
export async function requirePermission(
  permission: Permission
): Promise<AuthUser> {
  const user = await requireUserOrThrow()
  if (!hasPermission(user.role, permission)) {
    throw new UnauthorizedError()
  }
  return user
}

/** Convenience authz guards for the most common roles. */
export const requireAdmin = () => requireRole('ADMIN', 'SUPER_ADMIN')
export const requireSuperAdmin = () => requireRole('SUPER_ADMIN')
export const requireSeller = () => requireRole('SELLER', 'ADMIN', 'SUPER_ADMIN')
