'use client'

import { useActionState } from 'react'
import { updateSellerBadgeAction, type AdminActionState } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { SellerBadge } from '@/types/store'

const BADGE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tanpa Badge' },
  { value: 'STAR', label: '⭐ Star' },
  { value: 'MALL', label: '🏬 Mall' },
  { value: 'OFFICIAL', label: '🏅 Official' },
]

interface SellerBadgeFormProps {
  storeId: string
  currentBadge: SellerBadge | null
}

export function SellerBadgeForm({ storeId, currentBadge }: SellerBadgeFormProps) {
  const [state, formAction, pending] = useActionState<
    AdminActionState | undefined,
    FormData
  >(updateSellerBadgeAction, undefined)

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="storeId" value={storeId} />
      <Select
        name="badge"
        defaultValue={currentBadge ?? ''}
        className="w-40 text-xs"
      >
        {BADGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? '...' : 'Simpan'}
      </Button>
      {state?.message && (
        <p className="text-xs text-danger-600">{state.message}</p>
      )}
    </form>
  )
}
