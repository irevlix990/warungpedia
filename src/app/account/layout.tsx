import type { ReactNode } from 'react'
import { requireUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'

export default async function AccountLayout({
  children,
}: {
  children: ReactNode
}) {
  const t = getDictionary()
  await requireUser()

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50">
        {t.account.title}
      </h1>
      {children}
    </main>
  )
}
