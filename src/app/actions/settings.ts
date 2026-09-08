'use server'

import { requireAdmin } from '@/lib/auth/dal'
import { z } from 'zod'
import {
  updatePaymentBankSettings,
  type PaymentBankSettings,
} from '@/services/payment-settings-service'

export interface SettingsActionState {
  errors?: Record<string, string[] | undefined>
  message?: string
  success?: boolean
}

const bankSettingsSchema = z.object({
  bankName: z.string().min(1, 'Nama bank wajib diisi.').max(100),
  accountNumber: z.string().min(1, 'Nomor rekening wajib diisi.').max(30),
  accountName: z.string().min(1, 'Nama pemegang rekening wajib diisi.').max(100),
  paymentDeadlineHours: z.coerce
    .number({ message: 'Batas waktu harus berupa angka.' })
    .min(1, 'Minimal 1 jam.')
    .max(72, 'Maksimal 72 jam.'),
})

export async function updateBankSettingsAction(
  _state: SettingsActionState | undefined,
  formData: FormData
): Promise<SettingsActionState> {
  await requireAdmin()

  const parsed = bankSettingsSchema.safeParse({
    bankName: formData.get('bankName')?.toString(),
    accountNumber: formData.get('accountNumber')?.toString(),
    accountName: formData.get('accountName')?.toString(),
    paymentDeadlineHours: formData.get('paymentDeadlineHours')?.toString(),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    const settings: PaymentBankSettings = {
      bankName: parsed.data.bankName,
      accountNumber: parsed.data.accountNumber,
      accountName: parsed.data.accountName,
      paymentDeadlineHours: parsed.data.paymentDeadlineHours,
    }
    await updatePaymentBankSettings(settings)
  } catch (error) {
    return { message: (error as Error).message }
  }

  return { success: true }
}
