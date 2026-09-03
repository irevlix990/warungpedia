'use client'

import { useActionState } from 'react'
import { createWishlistAction, type SocialActionState } from '@/app/actions/social'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DictionarySocial } from '../auth/action-strings'

export function CreateWishlistForm({ t }: { t: DictionarySocial }) {
  const [state, formAction, pending] = useActionState<
    SocialActionState | undefined,
    FormData
  >(createWishlistAction, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="flex-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
        <span className="sr-only">{t.collectionName}</span>
        <Input
          name="name"
          maxLength={80}
          required
          placeholder={t.collectionName}
          error={Boolean(state?.errors?.name?.[0])}
        />
      </label>
      <Button type="submit" disabled={pending} className="shrink-0">
        {t.create}
      </Button>
      {state?.errors?.name?.[0] ? (
        <p className="text-xs text-danger-600 dark:text-danger-400">
          {state.errors.name[0]}
        </p>
      ) : null}
      {state?.message ? (
        <p className="text-xs text-danger-600 dark:text-danger-400">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
