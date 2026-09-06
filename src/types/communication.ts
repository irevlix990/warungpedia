/**
 * Domain types for communication & notifications: in-app notifications,
 * conversation-scoped chat, and notification preferences.
 */

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  link: string | null
  isRead: boolean
  createdAt: string
}

export interface NotificationType {
  id: string
  code: string
  label: string
}

/** Per-user prefs stored on `profiles.notification_prefs`. */
export interface NotificationPrefs {
  email: boolean
  push: boolean
  /** Per-type overrides; absent means enabled. */
  types: Record<string, boolean>
}

export interface Conversation {
  id: string
  orderId: string
  buyerId: string
  sellerId: string
  lastMessageAt: string
  createdAt: string
  /** Count of inbound unread messages for the acting participant. */
  unreadCount: number
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  body: string
  isRead: boolean
  createdAt: string
}

/** User → Admin support conversation (one per user). */
export interface SupportConversation {
  id: string
  userId: string
  adminId: string | null
  lastMessageAt: string | null
  createdAt: string
}

/** Message within a support conversation. */
export interface SupportMessage {
  id: string
  senderId: string
  body: string
  isRead: boolean
  createdAt: string
}