'use client'

import { useActionState } from 'react'
import { updatePasswordAction } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DictionaryAuth } from './action-strings'

export function UpdatePasswordForm({ t }: { t: DictionaryAuth }) {
  const [state, action, pending] = useActionState(
    updatePasswordAction,
    undefined
  )

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t.password}
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          error={Boolean(state?.errors?.password)}
        />
        {state?.errors?.password && (
          <p className="text-xs text-danger-600">{state.errors.password[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t.confirmPassword}
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          error={Boolean(state?.errors?.confirmPassword)}
        />
        {state?.errors?.confirmPassword && (
          <p className="text-xs text-danger-600">
            {state.errors.confirmPassword[0]}
          </p>
        )}
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

      <Button type="submit" disabled={pending} className="w-full">
        {t.resetPassword}
      </Button>
    </form>
  )
}
