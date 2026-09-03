'use client'

import { useActionState } from 'react'
import { updateProfileAction } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DictionaryAccount } from '../auth/action-strings'

interface ProfileFormProps {
  t: DictionaryAccount
  defaultValues: {
    fullName: string
    email: string
    avatarUrl: string | null
  }
}

export function ProfileForm({ t, defaultValues }: ProfileFormProps) {
  const [state, action, pending] = useActionState(
    updateProfileAction,
    undefined
  )

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t.fullName}
        </label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          defaultValue={defaultValues.fullName}
          error={Boolean(state?.errors?.fullName)}
        />
        {state?.errors?.fullName && (
          <p className="text-xs text-danger-600">{state.errors.fullName[0]}</p>
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
          autoComplete="tel"
          placeholder="08xxxxxxxxxx"
          error={Boolean(state?.errors?.phone)}
        />
        {state?.errors?.phone && (
          <p className="text-xs text-danger-600">{state.errors.phone[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t.email}
        </label>
        <Input
          id="email"
          value={defaultValues.email}
          disabled
          className="disabled:opacity-60"
        />
      </div>

      {state?.message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            state.success
              ? 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-200'
              : 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-200'
          }`}
        >
          {state.success ? t.saved : state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {t.edit}
      </Button>
    </form>
  )
}
