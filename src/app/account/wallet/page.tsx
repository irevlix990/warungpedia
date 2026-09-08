import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth/dal'
import {
  getWalletForUser,
  getLedgerForUser,
  getWithdrawalsForUser,
} from '@/services/payment-service'
import { WithdrawalForm } from '@/components/features/payment/withdrawal-form'
import { Card, Badge } from '@/components/ui'
import { formatIDR } from '@/utils/cn'

export const metadata: Metadata = {
  title: 'Dompet | Warungpedia',
}

export default async function AccountWalletPage() {
  const t = getDictionary()
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  // Show wallet for any user (buyer or seller)
  const [wallet, ledger, withdrawals] = await Promise.all([
    getWalletForUser(),
    getLedgerForUser(),
    getWithdrawalsForUser(),
  ])

  const statusLabel = (s: string) =>
    t.finance[`status${s[0]}${s.slice(1).toLowerCase()}` as keyof typeof t.finance]

  return (
    <div className="space-y-6">
      {/* Balance */}
      <Card className="p-5">
        <p className="text-sm text-neutral-500">{t.finance.balance}</p>
        <p className="mt-1 font-display text-3xl font-bold text-neutral-900 dark:text-neutral-50">
          {formatIDR(wallet.balance)}
        </p>
      </Card>

      {/* Ledger */}
      <Card className="p-5">
        <h2 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
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
                  {entry.amount >= 0 ? '+' : ''}{formatIDR(entry.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Withdrawal form */}
      <Card className="p-5">
        <h2 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
          {t.finance.withdrawalTitle}
        </h2>
        <div className="mt-3">
          <WithdrawalForm balance={wallet.balance} t={t.finance} walletMode />
        </div>
      </Card>

      {/* Withdrawal history */}
      <Card className="p-5">
        <h2 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
          {t.finance.withdrawalHistory}
        </h2>
        {withdrawals.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">{t.finance.noWithdrawals}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {withdrawals.map((w) => (
              <li key={w.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {formatIDR(w.amount)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {new Date(w.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
                <Badge variant={statusLabel(w.status) as any}>{w.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
