import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import {
  getNotifications,
  getNotificationTypes,
} from '@/services/communication-service'
import { MarkAllReadButton } from '@/components/features/communication/mark-all-read-button'
import { NotificationItem } from '@/components/features/communication/notification-item'
import { Card, EmptyState } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Notifikasi ',
}

export default async function NotificationsPage() {
  await requireUser()
  const t = getDictionary()
  const [notifications, types] = await Promise.all([
    getNotifications(60),
    getNotificationTypes(),
  ])
  const labels = Object.fromEntries(types.map((r) => [r.code, r.label]))

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {t.communication.title}
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            {t.communication.inbox}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/account/preferences"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/40"
          >
            {t.communication.preferences}
          </Link>
          <MarkAllReadButton t={t.communication} />
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="mt-6 p-6">
          <EmptyState title={t.communication.noNotifications} />
        </Card>
      ) : (
        <ul className="mt-6 space-y-2">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              typeLabel={labels[n.type] ?? n.type}
            />
          ))}
        </ul>
      )}
    </main>
  )
}