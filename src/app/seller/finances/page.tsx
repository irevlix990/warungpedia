import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth/dal'
import { getStoreByOwner } from '@/services/store-service'
import {
  getWalletForUser,
  getLedgerForUser,
  getEarningsForUser,
  getWithdrawalsForUser,
} from '@/services/payment-service'
import { WithdrawalForm } from '@/components/features/payment/withdrawal-form'
import { Card, Badge } from '@/components/ui'
import { formatIDR } from '@/utils/cn'

export const metadata: Metadata = {
  title: 'Keuangan ',
}

const statusVariant: Record<string, 'brand' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'warning',
  PROCESSING: 'brand',
  PAID: 'success',
  REJECTED: 'danger',
}

export default async function SellerFinancesPage() {
  const t = getDictionary()
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  if (user.role === 'BUYER') {
    return (
      <p className="text-sm text-neutral-500">{t.seller.buyerUnavailable}</p>
    )
  }

  const store = await getStoreByOwner(user.id).catch(() => null)
  if (!store || store.status !== 'ACTIVE') {
    return <p className="text-sm text-neutral-500">{t.seller.storeUnavailable}</p>
  }

  const [wallet, ledger, earnings, withdrawals] = await Promise.all([
    getWalletForUser(),
    getLedgerForUser(),
    getEarningsForUser(),
    getWithdrawalsForUser(),
  ])

  const statusLabel = (s: string) =>
    t.finance[`status${s[0]}${s.slice(1).toLowerCase()}` as keyof typeof t.finance]

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <p className="text-sm text-neutral-500">{t.finance.balance}</p>
            <p className="mt-1 font-display text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {formatIDR(wallet.balance)}
            </p>

            <h2 className="mt-6 font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
              {t.finance.ledger}
            </h2>
            {ledger.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">{t.finance.noLedger}</p>
            ) : (
              <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
                {ledger.map((entry) => (
                  <li key={entry.id} className="flex justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {entry.description ||
                          (entry.type === 'WITHDRAWAL'
                            ? t.finance.withdrawal
                            : t.finance.sale)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {new Date(entry.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-semibold ${
                        entry.amount >= 0
                          ? 'text-success-600 dark:text-success-400'
                          : 'text-danger-600 dark:text-danger-400'
                      }`}
                    >
                      {entry.amount >= 0 ? '+' : ''}
                      {formatIDR(entry.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
              {t.finance.withdrawalTitle}
            </h2>
            <div className="mt-3">
              <WithdrawalForm balance={wallet.balance} t={t.finance} />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
            {t.finance.earnings}
          </h2>
          {earnings.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">{t.finance.noEarnings}</p>
          ) : (
            <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
              {earnings.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap justify-between gap-2 py-3 text-sm"
                >
                  <div className="text-neutral-700 dark:text-neutral-200">
                    <p className="font-medium">
                      {t.finance.gross}: {formatIDR(e.gross)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {t.finance.commission}: {formatIDR(e.commission)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-success-600 dark:text-success-400">
                      {formatIDR(e.net)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {new Date(e.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
            {t.finance.withdrawalHistory}
          </h2>
          {withdrawals.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">
              {t.finance.noWithdrawals}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
              {withdrawals.map((w) => (
                <li key={w.id} className="py-3">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                        {formatIDR(w.amount)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {w.bankName} â€¢ {w.bankAccountNumber}
                      </p>
                    </div>
                    <Badge variant={statusVariant[w.status]}>
                      {statusLabel(w.status)}
                    </Badge>
                  </div>
                  {w.status === 'REJECTED' && w.rejectionReason && (
                    <p className="mt-1 text-xs text-danger-600">
                      {w.rejectionReason}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
