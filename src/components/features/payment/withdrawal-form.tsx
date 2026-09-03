'use client'

import { useActionState } from 'react'
import {
  requestWithdrawalAction,
  type PaymentActionState,
} from '@/app/actions/payment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DictionaryFinance } from '../auth/action-strings'

interface WithdrawalFormProps {
  balance: number
  t: DictionaryFinance
}

export function WithdrawalForm({ balance, t }: WithdrawalFormProps) {
  const [state, formAction, pending] = useActionState<
    PaymentActionState | undefined,
    FormData
  >(requestWithdrawalAction, undefined)

  const error = (field: string) => {
    const list = state?.errors?.[field]
    return list && list.length > 0 ? list[0] : undefined
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="amount"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.amount}
        </label>
        <Input
          id="amount"
          name="amount"
          type="number"
          inputMode="numeric"
          min={1}
          max={balance}
          required
          error={Boolean(error('amount'))}
        />
        {error('amount') && (
          <p className="text-xs text-danger-600">{error('amount')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="bankName"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.bankName}
        </label>
        <Input
          id="bankName"
          name="bankName"
          required
          error={Boolean(error('bankName'))}
        />
        {error('bankName') && (
          <p className="text-xs text-danger-600">{error('bankName')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="bankAccountNumber"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.bankAccountNumber}
        </label>
        <Input
          id="bankAccountNumber"
          name="bankAccountNumber"
          inputMode="numeric"
          required
          error={Boolean(error('bankAccountNumber'))}
        />
        {error('bankAccountNumber') && (
          <p className="text-xs text-danger-600">
            {error('bankAccountNumber')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="bankAccountName"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.bankAccountName}
        </label>
        <Input
          id="bankAccountName"
          name="bankAccountName"
          required
          error={Boolean(error('bankAccountName'))}
        />
        {error('bankAccountName') && (
          <p className="text-xs text-danger-600">{error('bankAccountName')}</p>
        )}
      </div>

      {state?.message && (
        <p className="text-sm text-danger-600">{state.message}</p>
      )}

      <Button type="submit" disabled={pending}>
        {t.request}
      </Button>
    </form>
  )
}
