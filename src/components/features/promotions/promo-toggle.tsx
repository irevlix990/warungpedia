'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { setFlashSaleActiveAction, setVoucherActiveAction } from '@/app/actions/promotions'

interface PromoToggleProps {
  id: string
  isActive: boolean
  kind: 'voucher' | 'flash'
  label: string
}

/** Admin toggle for the active flag of a voucher or flash sale. */
export function PromoToggle({ id, isActive, kind, label }: PromoToggleProps) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant={isActive ? 'outline' : 'primary'}
      size="sm"
      disabled={pending}
      onClick={() => {
        const form = new FormData()
        form.set(kind === 'voucher' ? 'voucherId' : 'flashSaleId', id)
        form.set('isActive', isActive ? 'on' : '')
        startTransition(() => {
          if (kind === 'voucher') {
            void setVoucherActiveAction(form)
          } else {
            void setFlashSaleActiveAction(form)
          }
        })
      }}
    >
      {label}
    </Button>
  )
}