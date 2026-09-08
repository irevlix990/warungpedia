'use client'

import { useState, useTransition } from 'react'
import { verifyPaymentAction } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'

export function VerifyPaymentButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function handleVerify() {
    setError(null)
    startTransition(async () => {
      const res = await verifyPaymentAction(orderId)
      if (res?.error) {
        setError(res.error)
      } else {
        setDone(true)
      }
    })
  }

  if (done) {
    return (
      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
        ✓ Pembayaran terverifikasi
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleVerify}
        disabled={isPending}
        className="w-full"
      >
        {isPending ? 'Memproses…' : 'Verifikasi Pembayaran'}
      </Button>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  )
}
