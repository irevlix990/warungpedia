import { z } from 'zod'

const uuid = z.string().uuid({ message: 'ID tidak valid.' })

/** Signed into `profiles.notification_prefs`. */
export const notificationPrefsSchema = z.object({
  email: z.boolean().default(true),
  push: z.boolean().default(true),
  types: z.record(z.string(), z.boolean()).default({}),
})

export type NotificationPrefsValues = z.infer<
  typeof notificationPrefsSchema
>

/** Marks a single notification read (agent path-free). */
export const markNotificationReadSchema = z.object({
  notificationId: uuid,
})

/** Sends one chat message. */
export const sendMessageSchema = z.object({
  conversationId: uuid,
  body: z
    .string()
    .trim()
    .min(1, { message: 'Pesan tidak boleh kosong.' })
    .max(2000, { message: 'Pesan terlalu panjang.' }),
})

/** Resolves/creates a conversation for an order. */
export const openConversationSchema = z.object({
  orderId: uuid,
})