import { z } from 'zod'

const uuid = z.string().uuid({ message: 'ID tidak valid.' })

/** Sends a support chat message. */
export const sendSupportMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, { message: 'Pesan tidak boleh kosong.' })
    .max(2000, { message: 'Pesan terlalu panjang.' }),
})

/** Marks the user's support conversation as read. */
export const markSupportConversationReadSchema = z.object({
  conversationId: uuid,
})
