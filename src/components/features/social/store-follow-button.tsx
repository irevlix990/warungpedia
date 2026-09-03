'use client'

import { useTransition } from 'react'
import { toggleFollowAction } from '@/app/actions/social'
import { Button } from '@/components/ui/button'
import type { DictionarySocial } from '../auth/action-strings'

interface StoreFollowButtonProps {
  storeId: string
  /** Whether the acting user already follows this store. */
  following: boolean
  t: DictionarySocial
}

export function StoreFollowButton({
  storeId,
  following,
  t,
}: StoreFollowButtonProps) {
  const [pending, startTransition] = useTransition()

  function handle() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('storeId', storeId)
      await toggleFollowAction(fd)
    })
  }

  return (
    <Button
      type="button"
      variant={following ? 'secondary' : 'outline'}
      size="sm"
      onClick={handle}
      disabled={pending}
    >
      {following ? `\u2713 ${t.following}` : `+ ${t.follow}`}
    </Button>
  )
}
