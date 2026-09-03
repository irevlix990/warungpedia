/**
 * Communication & notifications service — server-authoritative.
 *
 * Notification and chat writes flow through security-definer functions,
 * which enforce ownership/participation and (for messages) honor the
 * recipient's preferences. Reads are RLS-scoped to the owner / participants.
 */
import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import type {
  Conversation,
  Message,
  Notification,
  NotificationPrefs,
  NotificationType,
} from '@/types/communication'

type NotificationRow =
  Database['public']['Tables']['notifications']['Row']
type ConversationRow =
  Database['public']['Tables']['conversations']['Row']
type MessageRow = Database['public']['Tables']['messages']['Row']

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    isRead: row.is_read,
    createdAt: row.created_at,
  }
}

function mapConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    orderId: row.order_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    unreadCount: 0,
  }
}

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    isRead: row.is_read,
    createdAt: row.created_at,
  }
}

/** Available notification types (labels for UI). */
export const getNotificationTypes = cache(
  async (): Promise<NotificationType[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('notification_types')
      .select('id, code, label')
      .order('code', { ascending: true })
    if (error) {
      throw new Error('Gagal memuat jenis notifikasi.')
    }
    return (data ?? []).map((r) => ({
      id: r.id,
      code: r.code,
      label: r.label,
    }))
  }
)

/** The acting user's notifications, newest first. */
export const getNotifications = cache(
  async (limit = 50): Promise<Notification[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) {
      throw new Error('Gagal memuat notifikasi.')
    }
    return (data ?? []).map(mapNotification)
  }
)

/** Unread notification count for the acting user (for a badge). */
export const getUnreadNotificationCount = cache(
  async (): Promise<number> => {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
    if (error) return 0
    return count ?? 0
  }
)

/** Reads the acting user's notification preferences from their profile. */
export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('notification_prefs')
    .maybeSingle()
  if (error) {
    throw new Error('Gagal memuat preferensi notifikasi.')
  }
  const raw = data?.notification_prefs as Record<string, unknown> | undefined
  return {
    email: raw?.email !== false,
    push: raw?.push !== false,
    types: (raw?.types as Record<string, boolean> | undefined) ?? {},
  }
}

/** Saves the acting user's notification preferences. */
export async function setNotificationPrefs(
  userId: string,
  input: NotificationPrefs
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      notification_prefs: input as unknown as Database['public']['Tables']['profiles']['Update']['notification_prefs'],
    })
    .eq('id', userId)
  if (error) {
    throw new Error('Gagal menyimpan preferensi notifikasi.')
  }
}

/** Marks a single notification read. */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('mark_notification_read', {
    p_notification_id: notificationId,
  })
  if (error) {
    throw new Error('Gagal menandai notifikasi.')
  }
}

/** Marks all of the acting user's notifications read. */
export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('mark_all_notifications_read', {})
  if (error) {
    throw new Error('Gagal menandai semua notifikasi.')
  }
}

/** The acting user's conversations, newest message first, with unread counts. */
export const getConversations = cache(
  async (): Promise<Conversation[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
    if (error) {
      throw new Error('Gagal memuat percakapan.')
    }

    const result: Conversation[] = []
    const userId = (await supabase.auth.getUser()).data.user?.id ?? ''
    for (const row of data ?? []) {
      result.push({
        ...mapConversation(row),
        unreadCount: await unreadForConversation(row.id, userId),
      })
    }
    return result
  }
)

async function unreadForConversation(
  conversationId: string,
  userId: string
): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .not('sender_id', 'eq', userId)
  if (error) return 0
  return count ?? 0
}

/** Messages in a conversation (RLS-scoped to participants). */
export const getMessages = cache(
  async (conversationId: string): Promise<Message[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(500)
    if (error) {
      throw new Error('Gagal memuat pesan.')
    }
    return (data ?? []).map(mapMessage)
  }
)

/** A single conversation. */
export const getConversation = cache(
  async (conversationId: string): Promise<Conversation | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle()
    if (error || !data) return null
    return mapConversation(data)
  }
)

/** Gets or creates the acting user's conversation for an order. */
export async function openConversation(orderId: string): Promise<string> {
  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc('create_or_get_conversation', {
    p_order_id: orderId,
  })
  if (error) {
    throw new Error(mapCommunicationError(error.code, error.message))
  }
  if (!id) throw new Error('Gagal membuka percakapan.')
  return id
}

/** Sends a message. Returns the message id. */
export async function sendMessage(
  conversationId: string,
  body: string
): Promise<string> {
  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc('send_message', {
    p_conversation_id: conversationId,
    p_body: body,
  })
  if (error) {
    throw new Error(mapCommunicationError(error.code, error.message))
  }
  if (!id) throw new Error('Gagal mengirim pesan.')
  return id
}

/** Marks the acting user's inbound messages in a conversation read. */
export async function markConversationRead(conversationId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  })
  if (error) {
    throw new Error('Gagal menandai pesan dibaca.')
  }
}

/** Maps common Postgres/RLS errors to friendly, user-safe messages. */
function mapCommunicationError(code: string | null, message: string): string {
  switch (code) {
    case 'P0002':
      return message
    case '23514':
      return message
    case '42501':
      return 'Anda tidak memiliki izin untuk melakukan tindakan ini.'
    default:
      return 'Gagal memproses permintaan.'
  }
}