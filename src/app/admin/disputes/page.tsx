import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n'
import { getDisputesByStatus } from '@/services/shipping-service'
import { AdminDisputeActions } from '@/components/features/shipping/admin-dispute-actions'
import { Card, Badge, EmptyState } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Kelola Sengketa ',
}

const statusVariant: Record<string, 'warning' | 'success' | 'danger' | 'brand' | 'neutral'> = {
  OPEN: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CLOSED: 'neutral',
}

export default async function AdminDisputesPage() {
  const t = getDictionary()
  const disputes = await getDisputesByStatus('OPEN')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {t.shipping.adminTitle}
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          {t.shipping.adminResolve}
        </p>
      </div>

      {disputes.length === 0 ? (
        <EmptyState title={t.shipping.noDisputes} />
      ) : (
        <div className="grid gap-4">
          {disputes.map((d) => (
            <Card key={d.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-neutral-500">
                    {d.orderId}
                  </p>
                  <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-100">
                    {d.reason}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {new Date(d.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
                <Badge variant={statusVariant[d.status] ?? 'brand'}>
                  {d.status}
                </Badge>
              </div>
              <AdminDisputeActions disputeId={d.id} status={d.status} t={t.shipping} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}