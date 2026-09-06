'use server'

import { requireUserOrThrow } from '@/lib/auth/dal'
import { sendSupportMessageSchema } from '@/lib/validation/chat'
import { sendSupportMessage } from '@/services/communication-service'
import { createClient } from '@/lib/supabase/server'

export interface ChatActionState {
  errors?: Record<string, string[] | undefined>
  message?: string
  success?: boolean
}

/** Sends a message in the user's support conversation. */
export async function sendSupportMessageAction(
  _state: ChatActionState | undefined,
  formData: FormData
): Promise<ChatActionState> {
  await requireUserOrThrow()
  const parsed = sendSupportMessageSchema.safeParse({
    body: formData.get('body')?.toString(),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  try {
    await sendSupportMessage(parsed.data.body)
  } catch (error) {
    return { message: (error as Error).message }
  }
  return { success: true }
}

/** Marks inbound messages in the support conversation as read. */
export async function markSupportConversationReadAction(): Promise<void> {
  const user = await requireUserOrThrow().catch(() => null)
  if (!user) return
  try {
    const supabase = await createClient()
    await supabase.rpc('mark_support_conversation_read', {})
  } catch {
    // best-effort
  }
}

/** Admin: sends a reply to a user support conversation. */
export async function sendAdminSupportReplyAction(
  _state: ChatActionState | undefined,
  formData: FormData
): Promise<ChatActionState> {
  await requireUserOrThrow()
  const conversationId = formData.get('conversationId')?.toString()
  const body = formData.get('body')?.toString()

  if (!conversationId || !body?.trim()) {
    return { message: 'Pesan atau percakapan tidak valid.' }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc('admin_send_support_message', {
      p_conversation_id: conversationId,
      p_body: body.trim(),
    })
    if (error) {
      return { message: error.message }
    }
  } catch (error) {
    return { message: (error as Error).message }
  }

  return { success: true }
}

// Types (mirrors service type for convenience)
export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  body: string
  isRead: boolean
  createdAt: string
}
