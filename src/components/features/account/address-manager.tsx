'use client'

import * as React from 'react'
import { AddressList } from '@/components/features/account/address-list'
import { AddressForm } from '@/components/features/account/address-form'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import type { Address } from '@/types/address'
import type { DictionaryAccount } from '../auth/action-strings'

interface AddressManagerProps {
  t: DictionaryAccount
  addresses: Address[]
}

/**
 * Client wrapper for the addresses page: manages which address is being
 * edited and toggles the add/edit form.
 */
export function AddressManager({ t, addresses }: AddressManagerProps) {
  const [editing, setEditing] = React.useState<Address | null>(null)
  const [showForm, setShowForm] = React.useState(false)

  const handleEdit = (address: Address) => {
    setEditing(address)
    setShowForm(true)
  }

  const handleSubmitted = () => {
    setEditing(null)
    setShowForm(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {addresses.length === 0 ? (
          <p className="text-sm text-neutral-500">{t.noAddresses}</p>
        ) : (
          <AddressList t={t} addresses={addresses} onEdit={handleEdit} />
        )}
      </div>

      {showForm ? (
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {editing ? t.editAddress : t.addAddress}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(null)
                setShowForm(false)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <AddressForm
            t={t}
            editAddress={editing ?? undefined}
            onSubmitted={handleSubmitted}
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={() => setShowForm(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          {t.addAddress}
        </Button>
      )}
    </div>
  )
}