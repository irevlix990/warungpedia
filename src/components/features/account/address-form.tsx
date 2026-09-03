'use client'

import { useActionState } from 'react'
import { addAddressAction } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DictionaryAccount } from '../auth/action-strings'

interface AddressFormProps {
  t: DictionaryAccount
}

export function AddressForm({ t }: AddressFormProps) {
  const [state, action, pending] = useActionState(addAddressAction, undefined)

  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="label" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t.label}
        </label>
        <Input
          id="label"
          name="label"
          placeholder="Rumah / Kantor"
          defaultValue="Rumah"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="recipientName" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t.recipientName}
        </label>
        <Input
          id="recipientName"
          name="recipientName"
          required
          error={Boolean(state?.errors?.recipientName)}
        />
        {state?.errors?.recipientName && (
          <p className="text-xs text-danger-600">{state.errors.recipientName[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t.phone}
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          error={Boolean(state?.errors?.phone)}
        />
        {state?.errors?.phone && (
          <p className="text-xs text-danger-600">{state.errors.phone[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="street" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t.street}
        </label>
        <Input
          id="street"
          name="street"
          required
          error={Boolean(state?.errors?.street)}
        />
        {state?.errors?.street && (
          <p className="text-xs text-danger-600">{state.errors.street[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="district" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t.district}
        </label>
        <Input id="district" name="district" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="city" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t.city}
        </label>
        <Input
          id="city"
          name="city"
          required
          error={Boolean(state?.errors?.city)}
        />
        {state?.errors?.city && (
          <p className="text-xs text-danger-600">{state.errors.city[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="province" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t.province}
        </label>
        <Input
          id="province"
          name="province"
          required
          error={Boolean(state?.errors?.province)}
        />
        {state?.errors?.province && (
          <p className="text-xs text-danger-600">{state.errors.province[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="postalCode" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t.postalCode}
        </label>
        <Input
          id="postalCode"
          name="postalCode"
          inputMode="numeric"
          maxLength={5}
          error={Boolean(state?.errors?.postalCode)}
        />
        {state?.errors?.postalCode && (
          <p className="text-xs text-danger-600">{state.errors.postalCode[0]}</p>
        )}
      </div>

      <div className="flex items-center gap-2 sm:col-span-2">
        <input
          id="isDefault"
          name="isDefault"
          type="checkbox"
          className="size-4 rounded border-neutral-300 text-brand-600 focus-visible:ring-brand-500"
        />
        <label htmlFor="isDefault" className="text-sm text-neutral-700 dark:text-neutral-200">
          {t.setDefault}
        </label>
      </div>

      {state?.message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm sm:col-span-2 ${
            state.success
              ? 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-200'
              : 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-200'
          }`}
        >
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-fit sm:col-span-2">
        {t.addAddress}
      </Button>
    </form>
  )
}
