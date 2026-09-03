'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Role } from '@/config/roles'
import {
  setUserRoleAction,
  type AdminActionState,
} from '@/app/actions/admin'
import { Badge, Button } from '@/components/ui'
import type { DictionaryAdmin } from '@/components/features/auth/action-strings'

export function RoleBadge({ role }: { role: Role }) {
  const variant =
    role === 'SUPER_ADMIN'
      ? 'danger'
      : role === 'ADMIN'
        ? 'brand'
        : role === 'SELLER'
          ? 'info'
          : 'neutral'
  return <Badge variant={variant}>{role}</Badge>
}

export default function UserRoleForm({
  userId,
  role,
  canManage,
  t,
}: {
  userId: string
  role: Role
  canManage: boolean
  t: Pick<DictionaryAdmin, 'changeRole'>
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<
    AdminActionState | undefined,
    FormData
  >(setUserRoleAction, undefined)

  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state, router])

  if (!canManage) {
    return <RoleBadge role={role} />
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={role}
        className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      >
        <option value="BUYER">BUYER</option>
        <option value="SELLER">SELLER</option>
        <option value="ADMIN">ADMIN</option>
        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
      </select>
      <Button type="submit" variant="subtle" size="sm" disabled={pending}>
        {t.changeRole}
      </Button>
      {state?.message && (
        <Badge variant="danger">{state.message}</Badge>
      )}
    </form>
  )
}
