import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { getStoresByStatus } from '@/services/store-service'
import { AdminStoreList } from '@/components/features/admin/store-reviews'
import { EmptyState } from '@/components/ui'

export default async function AdminStoresPage() {
  const t = getDictionary()
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') redirect('/')

  const stores = await getStoresByStatus('PENDING')

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {t.admin.storesReview}
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          {t.admin.storesReviewSubtitle}
        </p>
      </div>

      {stores.length === 0 ? (
        <EmptyState title={t.admin.noPending} />
      ) : (
        <AdminStoreList stores={stores} t={t.admin} />
      )}
    </section>
  )
}