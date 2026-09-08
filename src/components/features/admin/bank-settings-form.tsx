'use client'

import { useActionState } from 'react'
import { updateBankSettingsAction, type SettingsActionState } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/providers/toast-provider'
import type { PaymentBankSettings } from '@/services/payment-settings-service'

interface BankSettingsFormProps {
  settings: PaymentBankSettings
}

export function BankSettingsForm({ settings }: BankSettingsFormProps) {
  const [state, formAction, pending] = useActionState<
    SettingsActionState | undefined,
    FormData
  >(updateBankSettingsAction, undefined)

  if (state?.success) {
    toast.success('Pengaturan bank berhasil disimpan.')
  }

  const error = (field: string) => {
    const list = state?.errors?.[field]
    return list && list.length > 0 ? list[0] : undefined
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label
          htmlFor="bankName"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          Nama Bank
        </label>
        <Input
          id="bankName"
          name="bankName"
          required
          defaultValue={settings.bankName}
          placeholder="Bank BCA"
        />
        {error('bankName') && (
          <p className="text-xs text-danger-600">{error('bankName')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="accountNumber"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          Nomor Rekening
        </label>
        <Input
          id="accountNumber"
          name="accountNumber"
          required
          defaultValue={settings.accountNumber}
          placeholder="1234567890"
        />
        {error('accountNumber') && (
          <p className="text-xs text-danger-600">{error('accountNumber')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="accountName"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          Atas Nama
        </label>
        <Input
          id="accountName"
          name="accountName"
          required
          defaultValue={settings.accountName}
          placeholder="PT Warungpedia Indonesia"
        />
        {error('accountName') && (
          <p className="text-xs text-danger-600">{error('accountName')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="paymentDeadlineHours"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          Batas Waktu Pembayaran (jam)
        </label>
        <Input
          id="paymentDeadlineHours"
          name="paymentDeadlineHours"
          type="number"
          required
          min={1}
          max={72}
          defaultValue={settings.paymentDeadlineHours}
        />
        {error('paymentDeadlineHours') && (
          <p className="text-xs text-danger-600">{error('paymentDeadlineHours')}</p>
        )}
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          Simpan Pengaturan
        </Button>
        {state?.message && (
          <p className="mt-2 text-sm text-danger-600">{state.message}</p>
        )}
      </div>
    </form>
  )
}
