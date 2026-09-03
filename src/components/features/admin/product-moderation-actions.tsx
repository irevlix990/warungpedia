'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  moderateProductAction,
  type AdminActionState,
} from '@/app/actions/admin'
import { Button, Badge } from '@/components/ui'
import type { DictionaryAdmin } from '@/components/features/auth/action-strings'
import type { ProductModerationStatus } from '@/types/admin'

const statusVariant: Record<
  ProductModerationStatus,
  'brand' | 'success' | 'neutral'
> = {
  DRAFT: 'neutral',
  ACTIVE: 'success',
  ARCHIVED: 'brand',
}

export default function ProductModerationActions({
  productId,
  status,
  isFeatured,
  t,
}: {
  productId: string
  status: ProductModerationStatus
  isFeatured: boolean
  t: Pick<
    DictionaryAdmin,
    | 'setActive'
    | 'setDraft'
    | 'setArchived'
    | 'toggleFeatured'
    | 'actions'
    | 'status'
    | 'featured'
  >
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<
    AdminActionState | undefined,
    FormData
  >(moderateProductAction, undefined)

  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state, router])

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex items-center gap-2">
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          <option value="ACTIVE">{t.setActive}</option>
          <option value="DRAFT">{t.setDraft}</option>
          <option value="ARCHIVED">{t.setArchived}</option>
        </select>
        <Badge variant={statusVariant[status]}>{status}</Badge>
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
        <input
          type="checkbox"
          name="featured"
          value="true"
          defaultChecked={isFeatured}
          className="rounded border-neutral-300"
        />
        {t.featured}
      </label>
      <Button type="submit" variant="subtle" size="sm" disabled={pending}>
        {t.actions}
      </Button>
      {state?.message && <Badge variant="danger">{state.message}</Badge>}
    </form>
  )
}
