import Link from 'next/link'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth/dal'
import { getUnreadNotificationCount } from '@/services/communication-service'

async function BellInner() {
  const user = await getCurrentUser()
  if (!user) return null
  const count = await getUnreadNotificationCount()

  return (
    <Link
      href="/notifications"
      aria-label="Notifikasi"
      className="relative grid size-9 place-items-center rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
        aria-hidden="true"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold leading-[18px] text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

/** Header bell with an unread badge. Rendered for signed-in users only. */
export function NotificationBell() {
  return (
    <Suspense fallback={null}>
      <BellInner />
    </Suspense>
  )
}