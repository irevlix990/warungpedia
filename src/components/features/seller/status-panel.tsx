import Link from 'next/link'
import { Button, Card } from '@/components/ui'
import { Badge } from '@/components/ui'
import type { Store, StoreStatus } from '@/types/store'
import type { DictionarySeller } from '../auth/action-strings'
import { resubmitStoreAction } from '@/app/actions/store'

const STATUS_BADGE: Record<StoreStatus, string> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  REJECTED: 'danger',
  SUSPENDED: 'info',
  CLOSED: 'neutral',
}

interface StatusPanelProps {
  store: Store
  t: DictionarySeller
}

export function StatusPanel({ store, t }: StatusPanelProps) {
  const badgeVariant = STATUS_BADGE[store.status] as 'warning' | 'success' | 'danger' | 'info' | 'neutral'
  const statusLabel = t[
    `status${store.status.charAt(0) + store.status.slice(1).toLowerCase()}` as keyof DictionarySeller
  ] ?? store.status

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-50">
          {t.status}
        </h2>
        <Badge variant={badgeVariant}>{statusLabel}</Badge>
      </div>

      <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
        {store.status === 'PENDING' && <p>{t.pendingHint}</p>}
        {store.status === 'ACTIVE' && (
          <>
            <p>{t.activeHint}</p>
            <Link
              href={`/store/${store.slug}`}
              className="font-semibold text-brand-600 hover:underline dark:text-brand-300"
            >
              {t.viewStore} →
            </Link>
          </>
        )}
        {store.status === 'REJECTED' && (
          <>
            <p>{t.rejectedHint}</p>
            {store.rejectionReason && (
              <p className="rounded-lg bg-danger-50 p-3 text-danger-700 dark:bg-danger-600/10 dark:text-danger-200">
                &ldquo;{store.rejectionReason}&rdquo;
              </p>
            )}
          </>
        )}
        {store.status === 'SUSPENDED' && <p>{t.suspendedHint}</p>}
        {store.status === 'CLOSED' && <p>{t.closedHint}</p>}
      </div>

      {store.status === 'REJECTED' && (
        <form action={resubmitStoreAction}>
          <input type="hidden" name="storeId" value={store.id} />
          <Button type="submit">{t.resubmit}</Button>
        </form>
      )}
    </Card>
  )
}