import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { getStoreByOwner } from '@/services/store-service'
import { getCategories } from '@/services/catalog-service'
import { ProductForm } from '@/components/features/seller/product-form'

export default async function NewProductPage() {
  const t = getDictionary()
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  const store = await getStoreByOwner(user.id).catch(() => null)
  if (!store || user.role === 'BUYER') redirect('/seller/apply')
  if (store.status !== 'ACTIVE') redirect('/seller/status')

  const categories = await getCategories().catch(() => [])

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {t.product.addProduct}
        </h2>
      </div>
      <ProductForm t={t.product} categories={categories} />
    </section>
  )
}
