'use client'

import { useActionState } from 'react'
import {
  escalateDisputeAction,
  type ShippingActionState,
} from '@/app/actions/shipping'
import { Button } from '@/components/ui/button'
import type { DictionaryShipping } from '../auth/action-strings'

interface EscalateDisputeFormProps {
  returnId: string
  t: DictionaryShipping
}

export function EscalateDisputeForm({
  returnId,
  t,
}: EscalateDisputeFormProps) {
  const [state, formAction, pending] = useActionState<
    ShippingActionState | undefined,
    FormData
  >(escalateDisputeAction, undefined)

  return (
    <div className="mt-3 rounded-xl border border-danger-200 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-900/20">
      <p className="text-sm font-semibold text-danger-700 dark:text-danger-200">
        {t.escalate}
      </p>
      <p className="mt-1 text-xs text-danger-700/80 dark:text-danger-200/80">
        {t.escalateHint}
      </p>
      <form action={formAction} className="mt-3 space-y-2">
        <input type="hidden" name="returnId" value={returnId} />
        <textarea
          name="reason"
          required
          rows={2}
          placeholder={t.disputeReason}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:border-brand-500 focus-visible:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
        />
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          {t.escalate}
        </Button>
        {state?.message && (
          <p className="text-sm text-danger-600">{state.message}</p>
        )}
      </form>
    </div>
  )
}