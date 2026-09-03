'use client'

import { useActionState, useEffect, useRef } from 'react'
import {
  markConversationReadAction,
  sendMessageAction,
  type CommunicationActionState,
} from '@/app/actions/communication'
import type { Message } from '@/types/communication'
import { Button } from '@/components/ui/button'
import type { DictionaryCommunication } from '../auth/action-strings'

interface ChatThreadProps {
  conversationId: string
  messages: Message[]
  currentUserId: string
  t: DictionaryCommunication
}

export function ChatThread({
  conversationId,
  messages,
  currentUserId,
  t,
}: ChatThreadProps) {
  const [composerState, formAction, pending] = useActionState<
    CommunicationActionState | undefined,
    FormData
  >(sendMessageAction, undefined)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  useEffect(() => {
    const fd = new FormData()
    fd.set('conversationId', conversationId)
    void markConversationReadAction(fd).catch(() => undefined)
  }, [conversationId])

  return (
    <div className="flex h-[60vh] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-neutral-500">
            {t.noConversations}
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isMine={m.senderId === currentUserId}
            />
          ))
        )}
        <div ref={endRef} />
      </div>

      <form
        action={formAction}
        className="flex items-end gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800"
      >
        <input type="hidden" name="conversationId" value={conversationId} />
        <textarea
          name="body"
          rows={1}
          placeholder={t.message}
          className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:border-brand-500 focus-visible:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50"
        />
        <Button type="submit" disabled={pending}>
          {t.send}
        </Button>
      </form>
      {composerState?.message && (
        <p className="px-3 pb-2 text-sm text-danger-600">
          {composerState.message}
        </p>
      )}
    </div>
  )
}

function MessageBubble({
  message,
  isMine,
}: {
  message: Message
  isMine: boolean
}) {
  return (
    <div
      className={`flex ${
        isMine ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
          isMine
            ? 'rounded-br-md bg-brand-600 text-white'
            : 'rounded-bl-md bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p
          className={`mt-1 text-[10px] ${
            isMine
              ? 'text-brand-100'
              : 'text-neutral-400 dark:text-neutral-500'
          }`}
        >
          {new Date(message.createdAt).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}