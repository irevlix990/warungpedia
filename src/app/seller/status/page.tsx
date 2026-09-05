import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { getStoreByOwner } from '@/services/store-service'
import { StatusPanel } from '@/components/features/seller/status-panel'

export default async function SellerStatusPage() {
  const t = getDictionary()
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  const store = await getStoreByOwner(user.id).catch(() => null)

  if (!store) {
    if (user.role === 'BUYER') redirect('/seller/apply')
    return (
      <section className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {t.seller.noStore}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-2xl">
      <StatusPanel store={store} t={t.seller} />
    </section>
  )
}