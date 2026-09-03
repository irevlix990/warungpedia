import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n'
import { getAdminProducts } from '@/services/admin-service'
import { Card, EmptyState, Input, Button } from '@/components/ui'
import ProductModerationActions from '@/components/features/admin/product-moderation-actions'
import { formatIDR } from '@/utils/cn'
import type { ProductModerationStatus } from '@/types/admin'

export const metadata: Metadata = {
  title: 'Moderasi Produk | Admin ',
}

interface SearchParams {
  status?: string
  q?: string
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const t = getDictionary().admin
  const { status, q } = await searchParams
  const statusFilter = (['DRAFT', 'ACTIVE', 'ARCHIVED'] as const).includes(
    status as ProductModerationStatus
  )
    ? (status as ProductModerationStatus)
    : undefined

  const products = await getAdminProducts(statusFilter, q)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {t.products}
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          {t.productsSubtitle}
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="flex flex-col gap-1 text-sm text-neutral-700 dark:text-neutral-200">
          {t.filterStatus}
          <select
            name="status"
            defaultValue={statusFilter ?? ''}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="">{t.allStatuses}</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-700 dark:text-neutral-200">
          {t.search}
          <Input
            name="q"
            defaultValue={q ?? ''}
            placeholder={t.searchPlaceholder}
          />
        </label>
        <Button type="submit" variant="outline" size="sm">
          {t.search}
        </Button>
      </form>

      {products.length === 0 ? (
        <EmptyState title={t.noProducts} />
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {p.name}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {p.storeName ?? 'â€”'} Â· {p.categoryName ?? 'â€”'}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {formatIDR(p.price)} Â· {t.stock}: {p.stock}
                  </p>
                </div>
                <ProductModerationActions
                  productId={p.id}
                  status={p.status}
                  isFeatured={p.isFeatured}
                  t={t}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
