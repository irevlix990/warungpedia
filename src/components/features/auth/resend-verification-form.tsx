'use client'

import { useActionState } from 'react'
import { resendVerification } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DictionaryAuth } from './action-strings'

export function ResendVerificationForm({ t }: { t: DictionaryAuth }) {
  const [state, action, pending] = useActionState(resendVerification, undefined)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t.email}
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          error={Boolean(state?.errors?.email)}
        />
        {state?.errors?.email && (
          <p className="text-xs text-danger-600">{state.errors.email[0]}</p>
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
        {t.resendEmail}
      </Button>
    </form>
  )
}
