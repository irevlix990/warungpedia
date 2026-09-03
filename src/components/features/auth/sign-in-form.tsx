'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signIn } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DictionaryAuth } from './action-strings'

export function SignInForm({ t }: { t: DictionaryAuth }) {
  const [state, action, pending] = useActionState(signIn, undefined)

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
          <p className="text-xs text-danger-600">
            {state.errors.email[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            {t.password}
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300"
          >
            {t.forgotPassword}
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={Boolean(state?.errors?.password)}
        />
        {state?.errors?.password && (
          <p className="text-xs text-danger-600">
            {state.errors.password[0]}
          </p>
        )}
      </div>

      {state?.message && (
        <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:bg-danger-900/30 dark:text-danger-200">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? '...' : t.signIn}
      </Button>
    </form>
  )
}
