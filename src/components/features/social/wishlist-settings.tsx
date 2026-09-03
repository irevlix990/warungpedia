'use client'

import { useActionState, useTransition } from 'react'
import {
  deleteWishlistAction,
  renameWishlistAction,
  type SocialActionState,
} from '@/app/actions/social'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DictionarySocial } from '../auth/action-strings'

interface WishlistSettingsProps {
  wishlistId: string
  currentName: string
  t: DictionarySocial
}

export function WishlistSettings({
  wishlistId,
  currentName,
  t,
}: WishlistSettingsProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<
    SocialActionState | undefined,
    FormData
  >(renameWishlistAction, undefined)
  const [deleting, startDelete] = useTransition()

  function handleDelete() {
    if (!window.confirm(t.deleteConfirm)) return
    startDelete(async () => {
      const fd = new FormData()
      fd.set('wishlistId', wishlistId)
      await deleteWishlistAction(fd)
      router.push('/wishlist')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction} className="flex items-end gap-2">
        <input type="hidden" name="wishlistId" value={wishlistId} />
        <label className="flex-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          <span className="sr-only">{t.collectionName}</span>
          <Input
            name="name"
            defaultValue={currentName}
            maxLength={80}
            required
            error={Boolean(state?.errors?.name?.[0])}
          />
        </label>
        <Button type="submit" disabled={pending} className="shrink-0">
          {t.rename}
        </Button>
      </form>
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
      <div>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {t.delete}
        </Button>
      </div>
    </div>
  )
}
