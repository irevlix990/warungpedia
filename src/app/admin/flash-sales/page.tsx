import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n'
import { getFlashSales, getProductsForFlashSale } from '@/services/promotions-service'
import { FlashSaleForm } from '@/components/features/promotions/flash-sale-form'
import { PromoToggle } from '@/components/features/promotions/promo-toggle'
import { Card, Badge, EmptyState, SectionTitle } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Kelola Flash Sale ',
}

const typeLabel: Record<string, string> = {
  PERCENT: '%',
  AMOUNT: 'IDR',
}

export default async function AdminFlashSalesPage() {
  const t = getDictionary()
  const [sales, products] = await Promise.all([
    getFlashSales(),
    getProductsForFlashSale().catch(() => []),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {t.promotions.flashSalesTitle}
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          {t.promotions.flashSalesSubtitle}
        </p>
      </div>

      {sales.length === 0 ? (
        <EmptyState title={t.promotions.noFlashSales} />
      ) : (
        <div className="grid gap-4">
          {sales.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      {s.productName ?? s.productId}
                    </p>
                    <Badge variant={s.isActive ? 'brand' : 'neutral'}>
                      {s.isActive ? t.promotions.active : 'â€”'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {s.discountValue}
                    {typeLabel[s.discountType]}
                  </p>
                </div>
                <PromoToggle
                  id={s.id}
                  isActive={s.isActive}
                  kind="flash"
                  label={t.promotions.toggle}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <section>
        <SectionTitle title={t.promotions.newFlashSale} />
        <Card className="mt-4 p-6">
          <FlashSaleForm t={t.promotions} products={products} />
        </Card>
      </section>
    </div>
  )
}