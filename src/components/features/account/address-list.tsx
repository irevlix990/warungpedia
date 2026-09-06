'use client'

import { removeAddressAction } from '@/app/actions/profile'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Edit, Trash2 } from 'lucide-react'
import { resolveProvinceName, resolveCityName } from '@/data/indonesia'
import type { Address } from '@/types/address'
import type { DictionaryAccount } from '../auth/action-strings'

interface AddressListProps {
  t: DictionaryAccount
  addresses: Address[]
  /** Called with the address to edit. */
  onEdit?: (address: Address) => void
}

export function AddressList({ t, addresses, onEdit }: AddressListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {addresses.map((address) => {
        const provinceName = resolveProvinceName(address.province)
        const cityName = resolveCityName(address.city)
        return (
          <li
            key={address.id}
            className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700"
          >
            <div className="flex items-start justify-between gap-4">
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
                  {address.district ? `, ${address.district}` : ''}, {cityName},{' '}
                  {provinceName}
                  {address.postalCode ? ` ${address.postalCode}` : ''}
                </p>
                {address.country && (
                  <p className="text-xs text-neutral-400">{address.country}</p>
                )}
                {address.latitude != null && address.longitude != null && (
                  <p className="flex items-center gap-1 text-xs text-brand-600">
                    <MapPin className="h-3 w-3" />
                    {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                  </p>
                )}
              </div>

              <div className="flex gap-1">
                {onEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title={t.edit}
                    onClick={() => onEdit(address)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                <form action={removeAddressAction}>
                  <input type="hidden" name="addressId" value={address.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    title={t.delete}
                    className="text-danger-600 hover:text-danger-700"
                    onClick={(e) => {
                      if (!window.confirm(t.deleteConfirm)) {
                        e.preventDefault()
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
