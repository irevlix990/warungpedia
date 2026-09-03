'use client'

import { useActionState } from 'react'
import {
  approveWithdrawalAction,
  rejectWithdrawalAction,
  type PaymentActionState,
} from '@/app/actions/payment'
import { Button } from '@/components/ui/button'
import type { DictionaryFinance } from '../auth/action-strings'

interface AdminWithdrawalActionsProps {
  withdrawalId: string
  status: string
  t: DictionaryFinance
}

export function AdminWithdrawalActions({
  withdrawalId,
  status,
  t,
}: AdminWithdrawalActionsProps) {
  const [rejectState, rejectAction, rejectPending] = useActionState<
    PaymentActionState | undefined,
    FormData
  >(rejectWithdrawalAction, undefined)

  if (status !== 'PENDING') {
    return null
  }

  return (
    <div className="mt-3 flex flex-col items-start gap-2">
      <form action={approveWithdrawalAction}>
        <input type="hidden" name="withdrawalId" value={withdrawalId} />
        <Button type="submit" variant="primary" size="sm">
          {t.approve}
        </Button>
      </form>

      <form action={rejectAction} className="w-full space-y-2">
        <input type="hidden" name="withdrawalId" value={withdrawalId} />
        <input
          name="reason"
          placeholder={t.reasonPlaceholder}
          className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none dark:border-neutral-700 dark:text-neutral-50"
        />
        <Button type="submit" variant="danger" size="sm" disabled={rejectPending}>
          {t.reject}
        </Button>
        {rejectState?.message && (
          <p className="text-xs text-danger-600">{rejectState.message}</p>
        )}
      </form>
    </div>
  )
}
