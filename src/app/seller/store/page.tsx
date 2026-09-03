import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { getStoreByOwner } from '@/services/store-service'
import { StoreSettingsForm } from '@/components/features/seller/store-settings-form'

export default async function SellerStorePage() {
  const t = getDictionary()
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  const store = await getStoreByOwner(user.id).catch(() => null)
  if (!store || user.role === 'BUYER') redirect('/seller/apply')
  if (store.status !== 'ACTIVE') redirect('/seller/status')

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {t.seller.settingsTitle}
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          {t.seller.settingsSubtitle}
        </p>
      </div>

      <StoreSettingsForm store={store} t={t.seller} />
    </section>
  )
}