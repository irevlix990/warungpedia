'use client'

import { useTransition } from 'react'
import { openConversationAction } from '@/app/actions/communication'
import { Button } from '@/components/ui/button'
import type { DictionaryCommunication } from '../auth/action-strings'

interface OpenChatButtonProps {
  orderId: string
  t: DictionaryCommunication
}

export function OpenChatButton({ orderId, t }: OpenChatButtonProps) {
  const [pending, startTransition] = useTransition()

  return (
    <form
      action={() => {
        const fd = new FormData()
        fd.set('orderId', orderId)
        startTransition(() =>
          openConversationAction(fd).then(() => undefined).catch(() => undefined)
        )
      }}
    >
      <Button type="submit" variant="outline" disabled={pending}>
        {t.openChat}
      </Button>
    </form>
  )
}