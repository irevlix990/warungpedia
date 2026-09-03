import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { getStoreByOwner } from '@/services/store-service'

const navLinkClass =
  'rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800'

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = getDictionary()
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  if (user.role === 'BUYER') {
    return <main className="container-wp py-10">{children}</main>
  }

  const store = await getStoreByOwner(user.id).catch(() => null)
  const isActive = store?.status === 'ACTIVE'

  return (
    <main className="container-wp py-10">
      <div className="mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <h1 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {t.seller.dashboard}
        </h1>
        <nav className="mt-2 flex items-center gap-1">
          <Link href="/seller" className={navLinkClass}>
            {t.seller.title}
          </Link>
          {isActive && (
            <Link href="/seller/products" className={navLinkClass}>
              {t.product.products}
            </Link>
          )}
          {isActive && (
            <Link href="/seller/store" className={navLinkClass}>
              {t.seller.myStore}
            </Link>
          )}
          {isActive && (
            <Link href="/seller/finances" className={navLinkClass}>
              {t.seller.finances}
            </Link>
          )}
          {isActive && (
            <Link href="/seller/analytics" className={navLinkClass}>
              {t.seller.analytics}
            </Link>
          )}
          {isActive && (
            <Link href="/seller/orders" className={navLinkClass}>
              {t.shipping.title}
            </Link>
          )}
          {isActive && (
            <Link href="/seller/returns" className={navLinkClass}>
              {t.shipping.returnTitle}
            </Link>
          )}
          <Link href="/seller/status" className={navLinkClass}>
            {t.seller.status}
          </Link>
        </nav>
      </div>
      {children}
    </main>
  )
}