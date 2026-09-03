'use client'

import { useTransition } from 'react'
import { resolveDisputeAction } from '@/app/actions/shipping'
import { Button } from '@/components/ui/button'
import type { DictionaryShipping } from '../auth/action-strings'

interface AdminDisputeActionsProps {
  disputeId: string
  status: string
  t: DictionaryShipping
}

export function AdminDisputeActions({
  disputeId,
  status,
  t,
}: AdminDisputeActionsProps) {
  const [pending, startTransition] = useTransition()

  if (status !== 'OPEN') return null

  const run = (approve: boolean) => {
    const fd = new FormData()
    fd.set('disputeId', disputeId)
    fd.set('approve', String(approve))
    startTransition(() =>
      resolveDisputeAction(fd).then(() => undefined).catch(() => undefined)
    )
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <Button
        variant="primary"
        size="sm"
        disabled={pending}
        onClick={() => run(true)}
      >
        {t.resolveApprove}
      </Button>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => run(false)}
      >
        {t.resolveReject}
      </Button>
    </div>
  )
}