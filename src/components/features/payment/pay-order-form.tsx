'use client'

import { useActionState } from 'react'
import { payOrderAction, type PaymentActionState } from '@/app/actions/payment'
import { Button } from '@/components/ui/button'
import type { DictionaryCart } from '../auth/action-strings'

interface PayOrderFormProps {
  orderId: string
  t: DictionaryCart
}

export function PayOrderForm({ orderId, t }: PayOrderFormProps) {
  const [state, formAction, pending] = useActionState<
    PaymentActionState | undefined,
    FormData
  >(payOrderAction, undefined)

  return (
    <div className="mt-5 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
      <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
        {t.payMethod}
      </h3>
      <form action={formAction} className="mt-3 space-y-3">
        <input type="hidden" name="orderId" value={orderId} />
        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
          <input
            type="radio"
            name="method"
            value="BANK_TRANSFER"
            defaultChecked
            className="size-4 text-brand-600 focus:ring-brand-500"
          />
          {t.payBankTransfer}
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
          <input
            type="radio"
            name="method"
            value="WALLET"
            className="size-4 text-brand-600 focus:ring-brand-500"
          />
          {t.payWallet}
        </label>
        <Button type="submit" disabled={pending}>
          {t.payNow}
        </Button>
        {state?.message && (
          <p className="text-sm text-danger-600">{state.message}</p>
        )}
      </form>
    </div>
  )
}
