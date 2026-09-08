'use client'

import { useState } from 'react'
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

const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Transfer Bank', icon: '🏦' },
  { value: 'WALLET', label: 'Dompet Digital', icon: '👛' },
  { value: 'COD', label: 'Bayar di Tempat (COD)', icon: '💵' },
] as const

export function CheckoutSummary({ totals, t, promo }: CheckoutSummaryProps) {
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')

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

      {/* Payment Method Selection */}
      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
          Metode Pembayaran
        </legend>
        <div className="space-y-2">
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method.value}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                paymentMethod === method.value
                  ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-950'
                  : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.value}
                checked={paymentMethod === method.value}
                onChange={() => setPaymentMethod(method.value)}
                className="accent-brand-600"
              />
              <span className="text-lg">{method.icon}</span>
              <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                {method.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <form action={checkoutAction} className="mt-5">
        <input type="hidden" name="paymentMethod" value={paymentMethod} />
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
