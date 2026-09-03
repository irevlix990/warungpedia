import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { getStoreByOwner } from '@/services/store-service'
import { getProductsByOwner } from '@/services/product-service'
import { ProductTable } from '@/components/features/seller/product-table'
import { Button } from '@/components/ui/button'

export default async function SellerProductsPage() {
  const t = getDictionary()
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  const store = await getStoreByOwner(user.id).catch(() => null)
  if (!store || user.role === 'BUYER') redirect('/seller/apply')
  if (store.status !== 'ACTIVE') redirect('/seller/status')

  const products = await getProductsByOwner(user.id)

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
            {t.product.products}
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            {store.name}
          </p>
        </div>
        <Link href="/seller/products/new">
          <Button size="sm">{t.product.addProduct}</Button>
        </Link>
      </div>

      <ProductTable products={products} t={t.product} />
    </section>
  )
}
