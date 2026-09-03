'use client'

import Link from 'next/link'
import { markNotificationReadAction } from '@/app/actions/communication'
import type { Notification } from '@/types/communication'

interface NotificationItemProps {
  notification: Notification
  typeLabel: string
}

export function NotificationItem({
  notification,
  typeLabel,
}: NotificationItemProps) {
  const read = notification.isRead

  return (
    <li>
      <Link
        href={notification.link ?? '/notifications'}
        tabIndex={0}
        onClick={() => {
          if (!read) {
            const fd = new FormData()
            fd.set('notificationId', notification.id)
            markNotificationReadAction(undefined, fd)
          }
        }}
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
          read
            ? 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
            : 'border-brand-200 bg-brand-50/60 dark:border-brand-900 dark:bg-brand-950/40'
        }`}
      >
        {!read && (
          <span
            aria-hidden="true"
            className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-600"
          />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`truncate text-sm font-semibold ${
                read
                  ? 'text-neutral-800 dark:text-neutral-200'
                  : 'text-neutral-900 dark:text-neutral-50'
              }`}
            >
              {notification.title}
            </p>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {typeLabel}
            </span>
          </div>
          {notification.body ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-300">
              {notification.body}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
            {new Date(notification.createdAt).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>
      </Link>
    </li>
  )
}