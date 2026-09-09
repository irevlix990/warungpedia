'use client'

import { useActionState } from 'react'
import { updateBuyerBadgeAction, type AdminActionState } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { BuyerBadge } from '@/types/payment'

const BADGE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tanpa Badge' },
  { value: 'BRONZE', label: '🥉 Bronze' },
  { value: 'SILVER', label: '🥈 Silver' },
  { value: 'GOLD', label: '🥇 Gold' },
  { value: 'PLATINUM', label: '💎 Platinum' },
  { value: 'VIP', label: '👑 VIP' },
]

interface BuyerBadgeFormProps {
  userId: string
  currentBadge: BuyerBadge | null
}

export function BuyerBadgeForm({ userId, currentBadge }: BuyerBadgeFormProps) {
  const [state, formAction, pending] = useActionState<
    AdminActionState | undefined,
    FormData
  >(updateBuyerBadgeAction, undefined)

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
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
