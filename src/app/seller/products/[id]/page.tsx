import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { getStoreByOwner } from '@/services/store-service'
import { getCategories } from '@/services/catalog-service'
import { getOwnableProductById } from '@/services/product-service'
import { ProductForm } from '@/components/features/seller/product-form'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = getDictionary()
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  const store = await getStoreByOwner(user.id).catch(() => null)
  if (!store || user.role === 'BUYER') redirect('/seller/apply')
  if (store.status !== 'ACTIVE') redirect('/seller/status')

  const product = await getOwnableProductById(id).catch(() => null)
  if (!product) notFound()

  const categories = await getCategories().catch(() => [])

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/seller/products"
        className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
      >
        ← {t.product.backToProducts}
      </Link>
      <div>
        <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {t.product.edit}: {product.name}
        </h2>
      </div>
      <ProductForm t={t.product} categories={categories} product={product} />
    </section>
  )
}
