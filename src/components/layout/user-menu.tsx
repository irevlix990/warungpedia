import Link from 'next/link'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { signOutAction } from '@/app/actions/auth'
import { hasPermission, PERMISSIONS } from '@/config/roles'

function AccountFallback() {
  return (
    <div className="flex items-center gap-2">
      <div className="size-9 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
    </div>
  )
}

async function UserMenuInner() {
  const user = await getCurrentUser()
  const t = getDictionary()

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/signin"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          {t.menu.signIn}
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-soft hover:bg-brand-700"
        >
          {t.menu.signUp}
        </Link>
      </div>
    )
  }

  const displayName = user.fullName.trim() || user.email || 'Warungpedia'
  const initial = (displayName[0] ?? 'W').toUpperCase()
  const isSeller = user.role === 'SELLER' || hasPermission(user.role, PERMISSIONS.MANAGE_STORE)
  const isAdmin = hasPermission(user.role, PERMISSIONS.MANAGE_USERS)

  return (
    <details className="relative">
      <summary
        className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        aria-label={t.menu.myProfile}
      >
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-100 font-display text-sm font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-200"
        >
          {initial}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-semibold text-neutral-800 lg:inline dark:text-neutral-100">
          {displayName}
        </span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-neutral-200 bg-white p-2 shadow-card dark:border-neutral-800 dark:bg-neutral-900">
        <div className="px-3 pb-2 pt-1">
          <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {displayName}
          </p>
          {user.email ? (
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
              {user.email}
            </p>
          ) : null}
        </div>
        <div className="border-t border-neutral-200 py-1 dark:border-neutral-800">
          <Link
            href="/account/profile"
            className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {t.menu.myProfile}
          </Link>
          <Link
            href="/account/addresses"
            className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {t.menu.myAddresses}
          </Link>
          <Link
            href="/cart"
            className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {t.menu.cart}
          </Link>
          <Link
            href="/orders"
            className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {t.menu.orders}
          </Link>
          <Link
            href="/notifications"
            className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {t.menu.notifications}
          </Link>
          <Link
            href="/chat"
            className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {t.menu.chat}
          </Link>
          <Link
            href="/wishlist"
            className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {t.menu.wishlist}
          </Link>
          <Link
            href="/following"
            className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {t.menu.following}
          </Link>
          {isSeller ? (
            <Link
              href="/seller"
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/40"
            >
              {t.menu.sellerDashboard}
            </Link>
          ) : null}
          {isAdmin ? (
            <Link
              href="/admin"
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/40"
            >
              {t.menu.adminDashboard}
            </Link>
          ) : null}
        </div>
        <div className="border-t border-neutral-200 pt-1 dark:border-neutral-800">
          <form action={signOutAction}>
            <button
              type="submit"
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-danger-600 hover:bg-danger-50 dark:text-danger-500 dark:hover:bg-danger-600/10"
            >
              {t.menu.signOut}
            </button>
          </form>
        </div>
      </div>
    </details>
  )
}

/** Account controls for the header. Wrapped in Suspense so the session
 * lookup (a dynamic cookie read) never blocks first paint of the shell. */
export function UserMenu() {
  return (
    <Suspense fallback={<AccountFallback />}>
      <UserMenuInner />
    </Suspense>
  )
}