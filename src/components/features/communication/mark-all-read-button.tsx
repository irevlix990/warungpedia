'use client'

import { useTransition } from 'react'
import { markAllNotificationsReadAction } from '@/app/actions/communication'
import { Button } from '@/components/ui/button'
import type { DictionaryCommunication } from '../auth/action-strings'

export function MarkAllReadButton({
  t,
}: {
  t: DictionaryCommunication
}) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => markAllNotificationsReadAction())}
    >
      {t.markAllRead}
    </Button>
  )
}