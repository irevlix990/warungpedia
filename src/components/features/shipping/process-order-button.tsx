'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui'
import { processOrderAction } from '@/app/actions/shipping'

interface ProcessOrderButtonProps {
  orderId: string
  t: {
    processOrder: string
    processOrderHint: string
  }
}

export function ProcessOrderButton({ orderId, t }: ProcessOrderButtonProps) {
  const [state, action, pending] = useActionState(processOrderAction, undefined)

  return (
    <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-950/30">
      <form action={action}>
        <input type="hidden" name="orderId" value={orderId} />
        <Button type="submit" disabled={pending} variant="primary" size="sm">
          {pending ? 'Memproses...' : t.processOrder}
        </Button>
        {state?.message && (
          <p className="mt-2 text-sm text-danger-600 dark:text-danger-400">
            {state.message}
          </p>
        )}
      </form>
      <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
        {t.processOrderHint}
      </p>
    </div>
  )
}
