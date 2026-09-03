import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import {
  getConversation,
  getMessages,
} from '@/services/communication-service'
import { ChatThread } from '@/components/features/communication/chat-thread'

export const metadata: Metadata = {
  title: 'Chat | Warungpedia',
}

interface ChatThreadPageProps {
  params: Promise<{ id: string }>
}

export default async function ChatThreadPage({
  params,
}: ChatThreadPageProps) {
  const user = await requireUser()
  const t = getDictionary()
  const { id } = await params
  const conversation = await getConversation(id)
  if (!conversation) notFound()
  const messages = await getMessages(id)

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/chat"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/40"
        >
          {t.common.back}
        </Link>
        <span className="truncate font-mono text-xs text-neutral-500">
          {conversation.orderId}
        </span>
      </div>
      <ChatThread
        conversationId={id}
        messages={messages}
        currentUserId={user.id}
        t={t.communication}
      />
    </main>
  )
}