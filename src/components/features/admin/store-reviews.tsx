'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { reviewStoreAction } from '@/app/actions/store'
import { Button } from '@/components/ui/button'
import { Badge, Card } from '@/components/ui'
import type { Store } from '@/types/store'
import type { DictionaryAdmin } from '../auth/action-strings'

interface StoreReviewItemProps {
  store: Store
  t: DictionaryAdmin
  onSuccess: () => void
}

function StoreReviewItem({ store, t, onSuccess }: StoreReviewItemProps) {
  const [state, action, pending] = useActionState(reviewStoreAction, undefined)

  useEffect(() => {
    if (state?.success) onSuccess()
  }, [state?.success, onSuccess])

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
            {store.name}
          </h3>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            /{store.slug}
          </p>
        </div>
        <Badge variant="warning">{store.status}</Badge>
      </div>

      <div className="space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
        {store.ownerId && (
          <p>
            {t.applicant} ID: <span className="font-mono">{store.ownerId}</span>
          </p>
        )}
        {store.contactEmail && <p>{store.contactEmail}</p>}
        <p>
          {t.appliedAt}:{' '}
          {new Date(store.createdAt).toLocaleDateString('id-ID')}
        </p>
      </div>

      <form action={action} className="space-y-3">
        <input type="hidden" name="storeId" value={store.id} />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`reason-${store.id}`}
            className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
          >
            {t.reason}
          </label>
          <textarea
            id={`reason-${store.id}`}
            name="reason"
            rows={2}
            placeholder={t.reasonPlaceholder}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            name="decision"
            value="approve"
            disabled={pending}
            variant="primary"
            size="sm"
          >
            {t.approve}
          </Button>
          <Button
            type="submit"
            name="decision"
            value="reject"
            disabled={pending}
            variant="danger"
            size="sm"
          >
            {t.reject}
          </Button>
        </div>

        {state?.message && !state.success && (
          <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700 dark:bg-danger-600/10 dark:text-danger-200">
            {state.message}
          </p>
        )}
      </form>
    </Card>
  )
}

interface AdminStoreListProps {
  stores: Store[]
  t: DictionaryAdmin
}

/** Client wrapper for the admin review list — refreshes the server list
 * after any successful approve/reject action so the reviewed store drops
 * out of the pending queue. */
export function AdminStoreList({ stores, t }: AdminStoreListProps) {
  const router = useRouter()

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {stores.map((store) => (
        <StoreReviewItem
          key={store.id}
          store={store}
          t={t}
          onSuccess={() => router.refresh()}
        />
      ))}
    </div>
  )
}