import Link from 'next/link'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { signOutAction } from '@/app/actions/auth'
import { hasPermission, PERMISSIONS } from '@/config/roles'
import { UserMenuDropdown } from './user-menu-dropdown'

function AccountFallback() {
  return (
    <div className="flex items-center gap-2">
      <div className="size-9 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
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
          className="rounded-xl px-3 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          {t.menu.signIn}
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-all hover:from-brand-700 hover:to-brand-800 hover:shadow-sm"
        >
          {t.menu.signUp}
        </Link>
      </div>
    )
  }

  const isSeller = user.role === 'SELLER' || hasPermission(user.role, PERMISSIONS.MANAGE_STORE)
  const isAdmin = hasPermission(user.role, PERMISSIONS.MANAGE_USERS)

  return (
    <UserMenuDropdown
      user={user}
      isSeller={isSeller}
      isAdmin={isAdmin}
      labels={{
        myProfile: t.menu.myProfile,
        myAddresses: t.menu.myAddresses,
        cart: t.menu.cart,
        orders: t.menu.orders,
        notifications: t.menu.notifications,
        chat: t.menu.chat,
        wishlist: t.menu.wishlist,
        following: t.menu.following,
        sellerDashboard: t.menu.sellerDashboard,
        adminDashboard: t.menu.adminDashboard,
        signOut: t.menu.signOut,
      }}
      signOutAction={signOutAction}
    />
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