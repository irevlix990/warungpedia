import { z } from 'zod'

const uuid = z.string().uuid({ message: 'ID tidak valid.' })

const requiredText = z
  .string()
  .trim()
  .min(1, { message: 'Wajib diisi.' })
  .max(200, { message: 'Terlalu panjang.' })

/** Validates a seller ship confirmation with tracking. */
export const shipOrderSchema = z.object({
  orderId: uuid,
  carrier: requiredText,
  trackingNumber: z
    .string()
    .trim()
    .min(4, { message: 'Nomor resi minimal 4 karakter.' })
    .max(80),
})

/** Validates a buyer return request for a line. */
export const requestReturnSchema = z.object({
  orderId: uuid,
  orderItemId: uuid,
  reasonId: z
    .string()
    .uuid({ message: 'Alasan pengembalian tidak valid.' })
    .nullable()
    .optional(),
  note: z.string().trim().max(1000).optional(),
})

/** Validates a seller response to a return. */
export const respondReturnSchema = z.object({
  returnId: uuid,
  approve: z.union([z.literal('true'), z.literal('false')]),
  note: z.string().trim().max(400).optional(),
})

/** Validates a buyer's dispute escalation. */
export const escalateDisputeSchema = z.object({
  returnId: uuid,
  reason: requiredText,
})

/** Validates an admin's dispute resolution. */
export const resolveDisputeSchema = z.object({
  disputeId: uuid,
  approve: z.union([z.literal('true'), z.literal('false')]),
  note: z.string().trim().max(400).optional(),
})

export type ShipOrderValues = z.infer<typeof shipOrderSchema>
export type RequestReturnValues = z.infer<typeof requestReturnSchema>
export type RespondReturnValues = z.infer<typeof respondReturnSchema>