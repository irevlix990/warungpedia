import { z } from 'zod'

const discountType = z.enum(['PERCENT', 'AMOUNT'], {
  message: 'Jenis diskon tidak valid.',
})

/** A voucher code input for checkout (plain text or empty). */
export const voucherApplySchema = z.object({
  voucherCode: z.string().trim().max(32, {
    message: 'Kode kupon maksimal 32 karakter.',
  }),
})

/** Validates an admin voucher create/edit submission. */
export const voucherInputSchema = z
  .object({
    description: z
      .string({ message: 'Deskripsi harus berupa teks.' })
      .trim()
      .max(255, { message: 'Deskripsi maksimal 255 karakter.' })
      .optional()
      .nullable(),
    discountType: discountType,
    discountValue: z
      .number({ message: 'Nilai diskon harus berupa angka.' })
      .int({ message: 'Nilai diskon harus bilangan bulat.' })
      .min(1, { message: 'Nilai diskon minimal 1.' }),
    minSpend: z
      .number({ message: 'Minimal belanja harus berupa angka.' })
      .int({ message: 'Minimal belanja harus bilangan bulat.' })
      .min(0, { message: 'Minimal belanja tidak boleh negatif.' })
      .optional(),
    maxDiscount: z
      .number({ message: 'Maksimal diskon harus berupa angka.' })
      .int({ message: 'Maksimal diskon harus bilangan bulat.' })
      .min(1, { message: 'Maksimal diskon minimal 1.' })
      .nullable()
      .optional(),
    perUserLimit: z
      .number({ message: 'Batas pemakaian harus berupa angka.' })
      .int({ message: 'Batas pemakaian harus bilangan bulat.' })
      .min(0, { message: 'Batas pemakaian tidak boleh negatif.' })
      .optional(),
    totalUsageLimit: z
      .number({ message: 'Batas total harus berupa angka.' })
      .int({ message: 'Batas total harus bilangan bulat.' })
      .min(1, { message: 'Batas total minimal 1.' })
      .nullable()
      .optional(),
    isActive: z.boolean().optional(),
    startsAt: z
      .string({ message: 'Waktu mulai tidak valid.' })
      .datetime({ offset: true })
      .nullable()
      .optional(),
    expiresAt: z
      .string({ message: 'Waktu berakhir tidak valid.' })
      .datetime({ offset: true })
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.discountType === 'PERCENT' &&
      data.discountValue != null &&
      data.discountValue > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Persen diskon maksimal 100.',
      })
    }
  })

/** Validates an admin flash-sale create/edit submission. */
export const flashSaleInputSchema = z
  .object({
    discountType: discountType,
    discountValue: z
      .number({ message: 'Nilai diskon harus berupa angka.' })
      .int({ message: 'Nilai diskon harus bilangan bulat.' })
      .min(1, { message: 'Nilai diskon minimal 1.' }),
    isActive: z.boolean().optional(),
    startsAt: z
      .string({ message: 'Waktu mulai tidak valid.' })
      .datetime({ offset: true })
      .nullable()
      .optional(),
    endsAt: z
      .string({ message: 'Waktu berakhir tidak valid.' })
      .datetime({ offset: true })
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.discountType === 'PERCENT' &&
      data.discountValue != null &&
      data.discountValue > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Persen diskon maksimal 100.',
      })
    }
  })

export type VoucherApplyValues = z.infer<typeof voucherApplySchema>
export type VoucherInputValues = z.infer<typeof voucherInputSchema>
export type FlashSaleInputValues = z.infer<typeof flashSaleInputSchema>