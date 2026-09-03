'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { applyVoucherPreviewAction } from '@/app/actions/promotions'
import { formatIDR } from '@/utils/cn'
import type { DictionaryPromotions } from '../auth/action-strings'

interface VoucherFieldProps {
  subtotal: number
  t: DictionaryPromotions
}

/**
 * Voucher entry for the checkout summary. The code lives in a real input
 * named `voucherCode` so the enclosing checkout form submits it to
 * `place_order` (which validates and applies it authoritatively). A lightweight
 * preview button validates against the acting user / subtotal for display only.
 */
export function VoucherField({ subtotal, t }: VoucherFieldProps) {
  const [code, setCode] = useState('')
  const [discount, setDiscount] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onPreview() {
    setPending(true)
    setMessage(null)
    const fd = new FormData()
    fd.set('voucherCode', code)
    fd.set('subtotal', String(subtotal))
    try {
      const res = await applyVoucherPreviewAction(undefined, fd)
      if (res.success) {
        setDiscount(res.discount ?? null)
      } else {
        setDiscount(null)
        setMessage(res.message ?? res.errors?.voucherCode?.[0] ?? t.invalidVoucher)
      }
    } catch {
      setDiscount(null)
      setMessage(t.invalidVoucher)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-800">
      <label
        htmlFor="voucher-code"
        className="text-sm font-semibold text-neutral-700 dark:text-neutral-200"
      >
        {t.voucherLabel}
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="voucher-code"
          name="voucherCode"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setDiscount(null)
          }}
          placeholder={t.voucherPlaceholder}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <Button
          type="button"
          variant="outline"
          disabled={pending || !code}
          onClick={onPreview}
        >
          {t.apply}
        </Button>
      </div>

      {discount != null && discount > 0 ? (
        <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          {t.voucherApplied} {formatIDR(discount)}
        </p>
      ) : message ? (
        <p className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400">
          {message}
        </p>
      ) : null}
    </div>
  )
}