import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { getConversations } from '@/services/communication-service'
import { Card, EmptyState } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Chat ',
}

export default async function ChatIndexPage() {
  await requireUser()
  const t = getDictionary()
  const conversations = await getConversations()

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50">
        {t.communication.chatTitle}
      </h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
        {t.communication.chatHint}
      </p>

      {conversations.length === 0 ? (
        <Card className="mt-6 p-6">
          <EmptyState title={t.communication.noConversations} />
        </Card>
      ) : (
        <ul className="mt-6 space-y-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/chat/${c.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-neutral-500">
                    {c.orderId}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {t.communication.chatTitle}
                  </p>
                </div>
                {c.unreadCount > 0 ? (
                  <span className="grid min-w-[20px] place-items-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white">
                    {c.unreadCount}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}