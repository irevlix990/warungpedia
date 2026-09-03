'use client'

import { useTransition } from 'react'
import { confirmReceiptAction } from '@/app/actions/shipping'
import { Button } from '@/components/ui/button'
import type { DictionaryShipping } from '../auth/action-strings'

interface ConfirmReceiptButtonProps {
  orderId: string
  t: DictionaryShipping
}

export function ConfirmReceiptButton({
  orderId,
  t,
}: ConfirmReceiptButtonProps) {
  const [pending, startTransition] = useTransition()

  return (
    <form
      action={() => {
        const fd = new FormData()
        fd.set('orderId', orderId)
        startTransition(() =>
          confirmReceiptAction(fd).then(() => undefined).catch(() => undefined)
        )
      }}
    >
      <Button type="submit" variant="secondary" disabled={pending}>
        {t.confirmReceipt}
      </Button>
      <p className="mt-2 text-xs text-neutral-500">{t.confirmReceiptHint}</p>
    </form>
  )
}