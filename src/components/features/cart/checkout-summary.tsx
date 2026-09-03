'use client'

import { checkoutAction } from '@/app/actions/cart'
import { Button } from '@/components/ui/button'
import { VoucherField } from './voucher-field'
import type { CartTotals } from '@/types/cart'
import type { DictionaryCart } from '../auth/action-strings'
import type { DictionaryPromotions } from '../auth/action-strings'

interface CheckoutSummaryProps {
  totals: CartTotals
  t: DictionaryCart
  promo?: DictionaryPromotions
}

export function CheckoutSummary({ totals, t, promo }: CheckoutSummaryProps) {
  return (
    <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
      <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-50">
        {t.orderSummary}
      </h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
          <dt>{t.subtotal}</dt>
          <dd>{totals.subtotalLabel}</dd>
        </div>
        <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
          <dt>{t.shippingFee}</dt>
          <dd>{totals.shippingFee === 0 ? t.freeShipping : totals.shippingFee}</dd>
        </div>
        <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-bold text-neutral-900 dark:border-neutral-700 dark:text-neutral-50">
          <dt>{t.total}</dt>
          <dd>{totals.totalLabel}</dd>
        </div>
      </dl>
      <form action={checkoutAction} className="mt-5">
        {promo ? (
          <VoucherField subtotal={totals.subtotal} t={promo} />
        ) : null}
        <Button type="submit" size="lg" className="w-full mt-4">
          {t.placeOrder}
        </Button>
      </form>
    </div>
  )
}
