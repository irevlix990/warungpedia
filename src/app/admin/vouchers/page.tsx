import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n'
import { getVouchers } from '@/services/promotions-service'
import { VoucherForm } from '@/components/features/promotions/voucher-form'
import { PromoToggle } from '@/components/features/promotions/promo-toggle'
import { Card, Badge, EmptyState, SectionTitle } from '@/components/ui'
import { formatIDR } from '@/utils/cn'

export const metadata: Metadata = {
  title: 'Kelola Kupon ',
}

const typeLabel: Record<string, string> = {
  PERCENT: '%',
  AMOUNT: 'IDR',
}

export default async function AdminVouchersPage() {
  const t = getDictionary()
  const vouchers = await getVouchers()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {t.promotions.vouchersTitle}
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          {t.promotions.vouchersSubtitle}
        </p>
      </div>

      {vouchers.length === 0 ? (
        <EmptyState title={t.promotions.noVouchers} />
      ) : (
        <div className="grid gap-4">
          {vouchers.map((v) => (
            <Card key={v.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-bold text-neutral-900 dark:text-neutral-50">
                      {v.code}
                    </p>
                    <Badge variant={v.isActive ? 'success' : 'neutral'}>
                      {v.isActive ? t.promotions.active : 'â€”'}
                    </Badge>
                  </div>
                  {v.description && (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                      {v.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-neutral-500">
                    {v.discountValue}
                    {typeLabel[v.discountType]} Â·{' '}
                    {t.promotions.minSpend}: {formatIDR(v.minSpend)} Â·{' '}
                    {t.promotions.used}: {v.usesCount}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PromoToggle
                    id={v.id}
                    isActive={v.isActive}
                    kind="voucher"
                    label={t.promotions.toggle}
                  />
                  <a
                    href={`/admin/vouchers/${v.id}`}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
                  >
                    {t.promotions.editVoucher}
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <section>
        <SectionTitle title={t.promotions.newVoucher} />
        <Card className="mt-4 p-6">
          <VoucherForm t={t.promotions} />
        </Card>
      </section>
    </div>
  )
}