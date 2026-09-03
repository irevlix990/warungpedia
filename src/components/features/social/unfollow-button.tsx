'use client'

import { useTransition } from 'react'
import { toggleFollowAction } from '@/app/actions/social'
import { Button } from '@/components/ui/button'

interface UnfollowButtonProps {
  storeId: string
  label: string
}

/** Toggles a follow; on the following list it reads as "unfollow". */
export function UnfollowButton({ storeId, label }: UnfollowButtonProps) {
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
      variant="secondary"
      size="sm"
      onClick={handle}
      disabled={pending}
    >
      {label}
    </Button>
  )
}
