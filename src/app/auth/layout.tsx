import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getCurrentUser } from '@/lib/auth/dal'

/**
 * Auth routes share a centered layout. Signed-in users are redirected home so
 * the sign-in/sign-up pages are never shown mid-session.
 */
export default async function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getCurrentUser()
  if (user) {
    redirect('/')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-crisp/40 via-bg to-bg px-4 py-10">
      <div className="w-full max-w-md">{children}</div>
    </main>
  )
}
