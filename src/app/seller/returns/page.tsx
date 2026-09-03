import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth/dal'
import { getReturnsForSeller } from '@/services/shipping-service'
import { ReturnSellerActions } from '@/components/features/shipping/return-seller-actions'
import { Card, Badge, EmptyState } from '@/components/ui'
import { formatIDR } from '@/utils/cn'

export const metadata: Metadata = {
  title: 'Pengembalian Penjual ',
}

const statusVariant: Record<string, 'warning' | 'success' | 'danger' | 'brand' | 'neutral'> = {
  REQUESTED: 'warning',
  APPROVED: 'brand',
  REFUNDED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
}

export default async function SellerReturnsPage() {
  const t = getDictionary()
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')
  if (user.role === 'BUYER') redirect('/seller/apply')

  const returns = await getReturnsForSeller().catch(() => [])

  const statusLabel = (s: string) =>
    t.shipping[`status${s[0]}${s.slice(1).toLowerCase()}` as keyof typeof t.shipping] ??
    s

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-50">
          {t.shipping.sellerTitle}
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          {t.shipping.sellerOverview}
        </p>
      </div>

      {returns.length === 0 ? (
        <EmptyState title={t.shipping.noReturns} />
      ) : (
        <div className="grid gap-4">
          {returns.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-neutral-500">{r.orderItemId}</p>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {r.note || 'â€”'}
                  </p>
                  {r.refundAmount !== null && (
                    <p className="mt-1 text-xs text-neutral-500">
                      {t.shipping.refundAmount}: {formatIDR(r.refundAmount)}
                    </p>
                  )}
                </div>
                <Badge variant={statusVariant[r.status] ?? 'neutral'}>
                  {statusLabel(r.status)}
                </Badge>
              </div>
              {r.status === 'REQUESTED' && (
                <ReturnSellerActions returnId={r.id} t={t.shipping} />
              )}
              {r.sellerNote && (
                <p className="mt-2 text-xs text-neutral-500">
                  {t.shipping.sellerNote}: {r.sellerNote}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}