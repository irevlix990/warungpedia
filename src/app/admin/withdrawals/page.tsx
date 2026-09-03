import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n'
import { getWithdrawalsByStatus } from '@/services/payment-service'
import { AdminWithdrawalActions } from '@/components/features/payment/admin-withdrawal-actions'
import { Card, Badge, EmptyState } from '@/components/ui'
import { formatIDR } from '@/utils/cn'

export const metadata: Metadata = {
  title: 'Penarikan | Admin ',
}

const statusVariant: Record<string, 'warning' | 'success' | 'danger' | 'neutral' | 'brand'> = {
  PENDING: 'warning',
  PROCESSING: 'brand',
  PAID: 'success',
  REJECTED: 'danger',
}

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const t = getDictionary()
  const { status: statusParam } = await searchParams
  const withdrawals = await getWithdrawalsByStatus(
    statusParam === 'PENDING' ||
      statusParam === 'PROCESSING' ||
      statusParam === 'PAID' ||
      statusParam === 'REJECTED'
      ? (statusParam as 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED')
      : undefined
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
            {t.admin.withdrawals}
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            {t.admin.withdrawalsSubtitle}
          </p>
        </div>
        <form method="get" className="flex items-center gap-2">
          <select
            name="status"
            defaultValue={statusParam ?? ''}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="">{t.admin.allStatuses}</option>
            <option value="PENDING">PENDING</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="PAID">PAID</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </form>
      </div>

      {withdrawals.length === 0 ? (
        <EmptyState title={t.admin.noWithdrawals} />
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w) => (
            <Card key={w.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {formatIDR(w.amount)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {w.bankName} Â· {w.bankAccountNumber} ({w.bankAccountName})
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {new Date(w.createdAt).toLocaleString('id-ID')}
                  </p>
                  {w.rejectionReason && (
                    <p className="mt-1 text-xs text-danger-600">
                      {w.rejectionReason}
                    </p>
                  )}
                </div>
                <Badge variant={statusVariant[w.status] ?? 'neutral'}>
                  {w.status}
                </Badge>
              </div>
              <AdminWithdrawalActions
                withdrawalId={w.id}
                status={w.status}
                t={t.finance}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
