'use client'

import { useActionState } from 'react'
import {
  requestReturnAction,
  type ShippingActionState,
} from '@/app/actions/shipping'
import { Button } from '@/components/ui/button'
import type { ReturnReason } from '@/types/shipping'
import type { DictionaryShipping } from '../auth/action-strings'

interface ReturnFormProps {
  orderId: string
  orderItemId: string
  itemName: string
  reasons: ReturnReason[]
  t: DictionaryShipping
}

export function ReturnForm({
  orderId,
  orderItemId,
  itemName,
  reasons,
  t,
}: ReturnFormProps) {
  const [state, formAction, pending] = useActionState<
    ShippingActionState | undefined,
    FormData
  >(requestReturnAction, undefined)

  return (
    <div className="mt-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {itemName}
      </p>
      <form action={formAction} className="mt-3 space-y-3">
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="orderItemId" value={orderItemId} />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`reason-${orderItemId}`}
            className="text-xs font-medium text-neutral-600 dark:text-neutral-300"
          >
            {t.reason}
          </label>
          <select
            id={`reason-${orderItemId}`}
            name="reasonId"
            className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus-visible:border-brand-500 focus-visible:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          >
            {reasons.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`note-${orderItemId}`}
            className="text-xs font-medium text-neutral-600 dark:text-neutral-300"
          >
            {t.note}
          </label>
          <textarea
            id={`note-${orderItemId}`}
            name="note"
            rows={2}
            placeholder={t.notePlaceholder}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:border-brand-500 focus-visible:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {t.submitReturn}
        </Button>
        {state?.message && (
          <p className="text-sm text-danger-600">{state.message}</p>
        )}
      </form>
    </div>
  )
}