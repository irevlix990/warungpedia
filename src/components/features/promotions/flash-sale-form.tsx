'use client'

import { useActionState } from 'react'
import {
  createFlashSaleAction,
  updateFlashSaleAction,
  type PromoActionState,
} from '@/app/actions/promotions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { FlashSale } from '@/types/promotions'
import type { DictionaryPromotions } from '../auth/action-strings'

interface FlashSaleFormProps {
  t: DictionaryPromotions
  products: { id: string; name: string }[]
  sale?: FlashSale
}

export function FlashSaleForm({ t, products, sale }: FlashSaleFormProps) {
  const action = sale ? updateFlashSaleAction : createFlashSaleAction
  const [state, formAction, pending] = useActionState<
    PromoActionState | undefined,
    FormData
  >(action, undefined)

  const error = (field: string) => {
    const list = state?.errors?.[field]
    return list && list.length > 0 ? list[0] : undefined
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {sale && <input type="hidden" name="flashSaleId" value={sale.id} />}

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label
          htmlFor="productId"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.product}
        </label>
        <Select
          id="productId"
          name="productId"
          required
          defaultValue={sale?.productId ?? ''}
        >
          <option value="" disabled>
            {t.productPlaceholder}
          </option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="discountType"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.discountType}
        </label>
        <Select
          id="discountType"
          name="discountType"
          defaultValue={sale?.discountType ?? 'PERCENT'}
        >
          <option value="PERCENT">{t.percent}</option>
          <option value="AMOUNT">{t.amount}</option>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="discountValue"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.discountValue}
        </label>
        <Input
          id="discountValue"
          name="discountValue"
          type="number"
          required
          min={1}
          step={1}
          defaultValue={sale?.discountValue}
          error={Boolean(error('discountValue'))}
        />
        {error('discountValue') && (
          <p className="text-xs text-danger-600">{error('discountValue')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="startsAt"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.startsAt}
        </label>
        <Input
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          defaultValue={sale?.startsAt?.slice(0, 16) ?? ''}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="endsAt"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.endsAt}
        </label>
        <Input
          id="endsAt"
          name="endsAt"
          type="datetime-local"
          defaultValue={sale?.endsAt?.slice(0, 16) ?? ''}
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 sm:col-span-2">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={sale?.isActive ?? true}
          className="size-4 text-brand-600 focus:ring-brand-500"
        />
        {t.active}
      </label>

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {sale ? t.editFlashSale : t.addFlashSale}
        </Button>
        {state?.message && (
          <p className="mt-2 text-sm text-danger-600">{state.message}</p>
        )}
      </div>
    </form>
  )
}