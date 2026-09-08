/**
 * Payment bank settings service.
 * Reads / writes the admin-configured bank account details used for
 * bank-transfer payments.
 */
import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/dal'

export interface PaymentBankSettings {
  bankName: string
  accountNumber: string
  accountName: string
  paymentDeadlineHours: number
}

const DEFAULT_SETTINGS: PaymentBankSettings = {
  bankName: 'Bank BCA',
  accountNumber: '1234567890',
  accountName: 'PT Warungpedia Indonesia',
  paymentDeadlineHours: 24,
}

/** Public (read-only) bank settings for buyers. */
export const getPaymentBankSettings = cache(
  async (): Promise<PaymentBankSettings> => {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc(
      'get_payment_bank_settings' as Parameters<typeof supabase.rpc>[0]
    )
    if (error || !data) return DEFAULT_SETTINGS
    const raw = typeof data === 'string' ? JSON.parse(data) : data
    return {
      bankName: raw.bank_name ?? DEFAULT_SETTINGS.bankName,
      accountNumber: raw.account_number ?? DEFAULT_SETTINGS.accountNumber,
      accountName: raw.account_name ?? DEFAULT_SETTINGS.accountName,
      paymentDeadlineHours:
        Number(raw.payment_deadline_hours) || DEFAULT_SETTINGS.paymentDeadlineHours,
    }
  }
)

/** Admin-only: update bank settings. */
export async function updatePaymentBankSettings(
  settings: PaymentBankSettings
): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => ReturnType<typeof supabase.rpc>
  )('update_payment_bank_settings', {
    p_bank_name: settings.bankName,
    p_account_number: settings.accountNumber,
    p_account_name: settings.accountName,
    p_payment_deadline_hours: settings.paymentDeadlineHours,
  })
  if (error) {
    throw new Error('Gagal menyimpan pengaturan bank.')
  }
}
