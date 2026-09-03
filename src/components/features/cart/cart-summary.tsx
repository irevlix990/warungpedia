'use client'

import { checkoutAction } from '@/app/actions/cart'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { CartTotals } from '@/types/cart'
import type { DictionaryCart } from '../auth/action-strings'

interface CartSummaryProps {
  totals: CartTotals
  hasItems: boolean
  t: DictionaryCart
}

export function CartSummary({ totals, hasItems, t }: CartSummaryProps) {
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
      {hasItems && (
        <form action={checkoutAction} className="mt-5">
          <Button type="submit" size="lg" className="w-full">
            {t.checkout}
          </Button>
        </form>
      )}
      <Link
        href="/search"
        className="mt-3 block text-center text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
      >
        {t.continueShopping}
      </Link>
    </div>
  )
}
