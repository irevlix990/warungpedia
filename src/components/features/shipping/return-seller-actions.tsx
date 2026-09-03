'use client'

import { useTransition } from 'react'
import { respondReturnAction } from '@/app/actions/shipping'
import { Button } from '@/components/ui/button'
import type { DictionaryShipping } from '../auth/action-strings'

interface ReturnSellerActionsProps {
  returnId: string
  t: DictionaryShipping
}

export function ReturnSellerActions({ returnId, t }: ReturnSellerActionsProps) {
  const [pending, startTransition] = useTransition()

  const run = (approve: boolean, note: string) => {
    const fd = new FormData()
    fd.set('returnId', returnId)
    fd.set('approve', String(approve))
    if (note) fd.set('note', note)
    startTransition(() =>
      respondReturnAction(fd).then(() => undefined).catch(() => undefined)
    )
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <Button
        variant="primary"
        size="sm"
        disabled={pending}
        onClick={() => run(true, '')}
      >
        {t.accept}
      </Button>
      <span className="text-xs text-neutral-400">{t.responseSeparator}</span>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => run(false, '')}
      >
        {t.decline}
      </Button>
    </div>
  )
}