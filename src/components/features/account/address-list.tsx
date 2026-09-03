'use client'

import { removeAddressAction } from '@/app/actions/profile'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Address } from '@/types/address'
import type { DictionaryAccount } from '../auth/action-strings'

interface AddressListProps {
  t: DictionaryAccount
  addresses: Address[]
}

export function AddressList({ t, addresses }: AddressListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {addresses.map((address) => (
        <li
          key={address.id}
          className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                {address.label}
              </span>
              {address.isDefault && <Badge variant="brand">{t.default}</Badge>}
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {address.recipientName} · {address.phone}
            </p>
            <p className="text-sm text-neutral-500">
              {address.street}
              {address.district ? `, ${address.district}` : ''}, {address.city},{' '}
              {address.province}
              {address.postalCode ? ` ${address.postalCode}` : ''}
            </p>
            {address.country && (
              <p className="text-xs text-neutral-400">{address.country}</p>
            )}
          </div>
          <form action={removeAddressAction}>
            <input type="hidden" name="addressId" value={address.id} />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              title={t.delete}
              onClick={(e) => {
                if (!window.confirm(t.deleteConfirm)) {
                  e.preventDefault()
                }
              }}
            >
              {t.delete}
            </Button>
          </form>
        </li>
      ))}
    </ul>
  )
}
