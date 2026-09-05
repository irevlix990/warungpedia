import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { getStoreByOwner } from '@/services/store-service'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function SellerDashboardPage() {
  const t = getDictionary()
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  if (user.role === 'BUYER') redirect('/seller/apply')

  const store = await getStoreByOwner(user.id).catch(() => null)

  if (!store) redirect('/seller/status')

  if (store.status !== 'ACTIVE') redirect('/seller/status')

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-50">
          {t.seller.myStore}
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          {store.name}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            {t.seller.settingsTitle}
          </h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t.seller.settingsSubtitle}
          </p>
          <Link href="/seller/store" className="mt-3 inline-block">
            <Button variant="secondary" size="sm">
              {t.seller.settingsTitle}
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            {t.seller.status}
          </h3>
          <p className="mt-1 text-sm text-success-600 dark:text-success-300">
            {t.seller.statusActive}
          </p>
          <Link href={`/store/${store.slug}`} className="mt-3 inline-block">
            <Button variant="secondary" size="sm">
              {t.seller.viewStore}
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          {t.seller.myStore}
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {t.seller.productsComingSoon}
        </p>
      </div>
    </section>
  )
}