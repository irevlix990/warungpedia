'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  setReviewStatusAction,
  type AdminActionState,
} from '@/app/actions/admin'
import { Button, Badge } from '@/components/ui'

export default function ReviewModerationActions({
  reviewId,
  status,
  labels,
}: {
  reviewId: string
  status: 'ACTIVE' | 'HIDDEN'
  labels: { hide: string; restore: string }
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<
    AdminActionState | undefined,
    FormData
  >(setReviewStatusAction, undefined)

  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state, router])

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="reviewId" value={reviewId} />
      <input
        type="hidden"
        name="status"
        value={status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE'}
      />
      <Button type="submit" variant="subtle" size="sm" disabled={pending}>
        {status === 'ACTIVE' ? labels.hide : labels.restore}
      </Button>
      {state?.message && <Badge variant="danger">{state.message}</Badge>}
    </form>
  )
}
