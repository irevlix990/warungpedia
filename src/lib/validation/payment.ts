import { z } from 'zod'

export const paymentMethods = ['WALLET', 'BANK_TRANSFER', 'COD'] as const

const intAmount = z
  .number({ message: 'Jumlah harus berupa angka.' })
  .int({ message: 'Jumlah harus bilangan bulat.' })
  .min(1, { message: 'Jumlah harus lebih besar dari 0.' })

/** Validates a buyer-initiated order payment. */
export const payOrderSchema = z.object({
  orderId: z.string().uuid({ message: 'ID pesanan tidak valid.' }),
  method: z.enum(paymentMethods, { message: 'Metode pembayaran tidak valid.' }),
})

/** Validates a seller withdrawal request. */
export const requestWithdrawalSchema = z.object({
  amount: intAmount,
  bankName: z
    .string()
    .trim()
    .min(2, { message: 'Nama bank wajib diisi.' })
    .max(80),
  bankAccountNumber: z
    .string()
    .trim()
    .regex(/^\d+$/, { message: 'Nomor rekening hanya angka.' })
    .min(4, { message: 'Nomor rekening minimal 4 digit.' })
    .max(30),
  bankAccountName: z
    .string()
    .trim()
    .min(2, { message: 'Nama pemilik rekening wajib diisi.' })
    .max(120),
})

/** Validates an admin's withdrawal decision. */
export const withdrawalDecisionSchema = z.object({
  withdrawalId: z.string().uuid({ message: 'ID penarikan tidak valid.' }),
  reason: z.string().trim().max(400).optional(),
})

export type PayOrderValues = z.infer<typeof payOrderSchema>
export type RequestWithdrawalValues = z.infer<typeof requestWithdrawalSchema>
