'use client'

import { useActionState, useEffect } from 'react'
import { addAddressAction, editAddressAction } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CascadingAddressSelect } from '@/components/ui/cascading-address-select'
import { MapPicker } from '@/components/ui/map-picker'
import type { Address } from '@/types/address'
import type { DictionaryAccount } from '../auth/action-strings'

interface AddressFormProps {
  t: DictionaryAccount
  /** If provided, the form operates in edit mode. */
  editAddress?: Address
  /** Called after successful submission. */
  onSubmitted?: () => void
}

export function AddressForm({ t, editAddress, onSubmitted }: AddressFormProps) {
  const isEdit = Boolean(editAddress)
  const action = isEdit ? editAddressAction : addAddressAction
  const [state, formAction, pending] = useActionState(action, undefined)

  // After successful submission, notify parent (e.g. to close the edit form)
  useEffect(() => {
    if (state?.success) onSubmitted?.()
  }, [state?.success, onSubmitted])

  return (
    <form
      action={formAction}
      className="flex flex-col gap-6"
      key={editAddress?.id ?? 'new'}
    >
      {isEdit && (
        <input type="hidden" name="addressId" value={editAddress!.id} />
      )}

      {/* ── Label + Recipient ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="label" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            {t.label}
          </label>
          <Input
            id="label"
            name="label"
            placeholder="Rumah / Kantor / Gudang"
            defaultValue={editAddress?.label ?? 'Rumah'}
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
            defaultValue={editAddress?.recipientName ?? ''}
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
            defaultValue={editAddress?.phone ?? ''}
            error={Boolean(state?.errors?.phone)}
          />
          {state?.errors?.phone && (
            <p className="text-xs text-danger-600">{state.errors.phone[0]}</p>
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
            defaultValue={editAddress?.postalCode ?? ''}
            error={Boolean(state?.errors?.postalCode)}
          />
          {state?.errors?.postalCode && (
            <p className="text-xs text-danger-600">{state.errors.postalCode[0]}</p>
          )}
        </div>
      </div>

      {/* ── Street Address ── */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="street" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t.street}
        </label>
        <Input
          id="street"
          name="street"
          placeholder="Jl. Merdeka No. 10, RT 01/RW 02"
          required
          defaultValue={editAddress?.street ?? ''}
          error={Boolean(state?.errors?.street)}
        />
        {state?.errors?.street && (
          <p className="text-xs text-danger-600">{state.errors.street[0]}</p>
        )}
      </div>

      {/* ── Cascading Address Select ── */}
      <CascadingAddressSelect
        names={{
          province: 'province',
          city: 'city',
          district: 'district',
          village: 'village',
        }}
        value={{
          province: editAddress?.province ?? '',
          city: editAddress?.city ?? '',
          district: editAddress?.district ?? '',
        }}
        labels={{
          province: t.province,
          city: t.city,
          district: t.district,
          village: t.village,
        }}
      />

      {/* ── Map Picker ── */}
      <MapPicker
        latName="latitude"
        lngName="longitude"
        value={{
          lat: editAddress?.latitude ?? null,
          lng: editAddress?.longitude ?? null,
        }}
      />

      {/* ── Set Default ── */}
      <div className="flex items-center gap-2">
        <input
          id="isDefault"
          name="isDefault"
          type="checkbox"
          defaultChecked={editAddress?.isDefault ?? false}
          className="size-4 rounded border-neutral-300 text-brand-600 focus-visible:ring-brand-500"
        />
        <label htmlFor="isDefault" className="text-sm text-neutral-700 dark:text-neutral-200">
          {t.setDefault}
        </label>
      </div>

      {state?.message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            state.success
              ? 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-200'
              : 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-200'
          }`}
        >
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {isEdit ? t.edit : t.addAddress}
      </Button>
    </form>
  )
}
