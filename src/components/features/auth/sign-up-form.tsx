'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { signUp } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DictionaryAuth } from './action-strings'

export function SignUpForm({ t }: { t: DictionaryAuth }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(signUp, undefined)

  useEffect(() => {
    if (state?.success) {
      router.push('/auth/verify')
    }
  }, [state, router])

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
          required
          error={Boolean(state?.errors?.fullName)}
        />
        {state?.errors?.fullName && (
          <p className="text-xs text-danger-600">{state.errors.fullName[0]}</p>
        )}
      </div>

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

      {state?.message && !state.success && (
        <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:bg-danger-900/30 dark:text-danger-200">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t.creatingAccount : t.signUp}
      </Button>
    </form>
  )
}
