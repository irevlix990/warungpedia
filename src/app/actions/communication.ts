'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUserOrThrow } from '@/lib/auth/dal'
import {
  markNotificationReadSchema,
  notificationPrefsSchema,
  openConversationSchema,
  sendMessageSchema,
} from '@/lib/validation/communication'
import {
  markAllNotificationsRead,
  markConversationRead,
  markNotificationRead,
  openConversation,
  sendMessage,
  setNotificationPrefs,
} from '@/services/communication-service'

export interface CommunicationActionState {
  errors?: Record<string, string[] | undefined>
  message?: string
  success?: boolean
}

/** Marks a single notification as read (link click / manual). */
export async function markNotificationReadAction(
  _state: CommunicationActionState | undefined,
  formData: FormData
): Promise<CommunicationActionState> {
  await requireUserOrThrow()
  const parsed = markNotificationReadSchema.safeParse({
    notificationId: formData.get('notificationId')?.toString(),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  try {
    await markNotificationRead(parsed.data.notificationId)
  } catch (error) {
    return { message: (error as Error).message }
  }
  revalidatePath('/account')
  revalidatePath('/notifications')
  return { success: true }
}

/** Marks all notifications as read. */
export async function markAllNotificationsReadAction(): Promise<void> {
  await requireUserOrThrow()
  await markAllNotificationsRead()
  revalidatePath('/notifications')
}

/** Saves the notification preferences. */
export async function saveNotificationPrefsAction(
  _state: CommunicationActionState | undefined,
  formData: FormData
): Promise<CommunicationActionState> {
  const user = await requireUserOrThrow()

  const typesRaw = Object.fromEntries(
    formData.getAll('type').map((v) => [v.toString(), true])
  )

  const parsed = notificationPrefsSchema.safeParse({
    email: formData.get('email') === 'on',
    push: formData.get('push') === 'on',
    types: typesRaw,
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await setNotificationPrefs(user.id, parsed.data)
  } catch (error) {
    return { message: (error as Error).message }
  }
  revalidatePath('/account/preferences')
  return { success: true }
}

/** Opens (or creates) a conversation for an order and redirects to it. */
export async function openConversationAction(formData: FormData): Promise<void> {
  await requireUserOrThrow()
  const parsed = openConversationSchema.safeParse({
    orderId: formData.get('orderId')?.toString(),
  })
  if (!parsed.success) redirect('/chat')
  let conversationId: string
  try {
    conversationId = await openConversation(parsed.data.orderId)
  } catch {
    redirect('/chat')
  }
  redirect(`/chat/${conversationId}`)
}

/** Sends a chat message. */
export async function sendMessageAction(
  _state: CommunicationActionState | undefined,
  formData: FormData
): Promise<CommunicationActionState> {
  await requireUserOrThrow()
  const parsed = sendMessageSchema.safeParse({
    conversationId: formData.get('conversationId')?.toString(),
    body: formData.get('body')?.toString(),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  try {
    await sendMessage(parsed.data.conversationId, parsed.data.body)
  } catch (error) {
    return { message: (error as Error).message }
  }
  revalidatePath(`/chat/${parsed.data.conversationId}`)
  revalidatePath('/chat')
  return { success: true }
}

/** Marks inbound messages in a conversation as read. */
export async function markConversationReadAction(formData: FormData): Promise<void> {
  await requireUserOrThrow()
  const conversationId = formData.get('conversationId')?.toString()
  if (!conversationId) return
  await markConversationRead(conversationId)
  revalidatePath(`/chat/${conversationId}`)
}