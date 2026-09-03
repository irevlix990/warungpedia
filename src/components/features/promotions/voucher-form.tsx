'use client'

import { useActionState } from 'react'
import {
  createVoucherAction,
  updateVoucherAction,
  type PromoActionState,
} from '@/app/actions/promotions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Voucher } from '@/types/promotions'
import type { DictionaryPromotions } from '../auth/action-strings'

interface VoucherFormProps {
  t: DictionaryPromotions
  voucher?: Voucher
}

export function VoucherForm({ t, voucher }: VoucherFormProps) {
  const action = voucher ? updateVoucherAction : createVoucherAction
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
      {voucher && <input type="hidden" name="voucherId" value={voucher.id} />}

      {!voucher && (
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label
            htmlFor="code"
            className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
          >
            {t.voucherCode}
          </label>
          <Input id="code" name="code" required maxLength={32} placeholder="HEMAT10" />
          {error('code') && (
            <p className="text-xs text-danger-600">{error('code')}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label
          htmlFor="description"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.description}
        </label>
        <Input
          id="description"
          name="description"
          defaultValue={voucher?.description ?? ''}
          placeholder={t.descriptionPlaceholder}
        />
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
          defaultValue={voucher?.discountType ?? 'PERCENT'}
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
          defaultValue={voucher?.discountValue}
          error={Boolean(error('discountValue'))}
        />
        {error('discountValue') && (
          <p className="text-xs text-danger-600">{error('discountValue')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="minSpend"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.minSpend}
        </label>
        <Input
          id="minSpend"
          name="minSpend"
          type="number"
          min={0}
          step={1}
          defaultValue={voucher?.minSpend ?? 0}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="maxDiscount"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.maxDiscount}
        </label>
        <Input
          id="maxDiscount"
          name="maxDiscount"
          type="number"
          min={1}
          step={1}
          defaultValue={voucher?.maxDiscount ?? ''}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="perUserLimit"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.perUserLimit}
        </label>
        <Input
          id="perUserLimit"
          name="perUserLimit"
          type="number"
          min={0}
          step={1}
          defaultValue={voucher?.perUserLimit ?? 1}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="totalUsageLimit"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.totalUsageLimit}
        </label>
        <Input
          id="totalUsageLimit"
          name="totalUsageLimit"
          type="number"
          min={1}
          step={1}
          defaultValue={voucher?.totalUsageLimit ?? ''}
        />
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
          defaultValue={voucher?.startsAt?.slice(0, 16) ?? ''}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="expiresAt"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.expiresAt}
        </label>
        <Input
          id="expiresAt"
          name="expiresAt"
          type="datetime-local"
          defaultValue={voucher?.expiresAt?.slice(0, 16) ?? ''}
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 sm:col-span-2">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={voucher?.isActive ?? true}
          className="size-4 text-brand-600 focus:ring-brand-500"
        />
        {t.active}
      </label>

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {voucher ? t.editVoucher : t.addVoucher}
        </Button>
        {state?.message && (
          <p className="mt-2 text-sm text-danger-600">{state.message}</p>
        )}
      </div>
    </form>
  )
}