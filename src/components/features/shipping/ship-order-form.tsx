'use client'

import { useActionState } from 'react'
import { shipOrderAction, type ShippingActionState } from '@/app/actions/shipping'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DictionaryShipping } from '../auth/action-strings'

interface ShipOrderFormProps {
  orderId: string
  t: DictionaryShipping
}

export function ShipOrderForm({ orderId, t }: ShipOrderFormProps) {
  const [state, formAction, pending] = useActionState<
    ShippingActionState | undefined,
    FormData
  >(shipOrderAction, undefined)

  const error = (field: string) => {
    const list = state?.errors?.[field]
    return list && list.length > 0 ? list[0] : undefined
  }

  return (
    <div className="mt-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="font-display text-sm font-bold text-neutral-900 dark:text-neutral-50">
        {t.shipOrder}
      </h3>
      <form action={formAction} className="mt-3 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="orderId" value={orderId} />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`carrier-${orderId}`}
            className="text-xs font-medium text-neutral-600 dark:text-neutral-300"
          >
            {t.carrier}
          </label>
          <Input
            id={`carrier-${orderId}`}
            name="carrier"
            required
            error={Boolean(error('carrier'))}
          />
          {error('carrier') && (
            <p className="text-xs text-danger-600">{error('carrier')}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`tracking-${orderId}`}
            className="text-xs font-medium text-neutral-600 dark:text-neutral-300"
          >
            {t.trackingNumber}
          </label>
          <Input
            id={`tracking-${orderId}`}
            name="trackingNumber"
            required
            error={Boolean(error('trackingNumber'))}
          />
          {error('trackingNumber') && (
            <p className="text-xs text-danger-600">
              {error('trackingNumber')}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {t.markShipped}
          </Button>
        </div>
        {state?.success && (
          <p className="text-sm text-success-600 sm:col-span-2">
            {t.shipped}
          </p>
        )}
        {state?.message && (
          <p className="text-sm text-danger-600 sm:col-span-2">
            {state.message}
          </p>
        )}
      </form>
    </div>
  )
}