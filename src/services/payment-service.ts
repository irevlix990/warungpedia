import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import type {
  Payment,
  PaymentMethod,
  LedgerEntry,
  SellerEarning,
  Wallet,
  Withdrawal,
  WithdrawalStatus,
} from '@/types/payment'

type PaymentRow = Database['public']['Tables']['payments']['Row']
type LedgerRow = Database['public']['Tables']['ledger_entries']['Row']
type EarningRow = Database['public']['Tables']['seller_earnings']['Row']
type WithdrawalRow = Database['public']['Tables']['withdrawals']['Row']

function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    orderId: row.order_id,
    userId: row.user_id,
    method: row.method,
    amount: row.amount,
    status: row.status,
    reference: row.reference,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  }
}

function mapLedger(row: LedgerRow): LedgerEntry {
  return {
    id: row.id,
    amount: row.amount,
    type: row.type,
    referenceType: row.reference_type,
    description: row.description,
    createdAt: row.created_at,
  }
}

function mapEarning(row: EarningRow): SellerEarning {
  return {
    id: row.id,
    orderId: row.order_id,
    storeId: row.store_id,
    gross: row.gross,
    commission: row.commission,
    net: row.net,
    status: row.status,
    createdAt: row.created_at,
  }
}

function mapWithdrawal(row: WithdrawalRow): Withdrawal {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    status: row.status,
    bankName: row.bank_name,
    bankAccountNumber: row.bank_account_number,
    bankAccountName: row.bank_account_name,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
  }
}

/**
 * Payment & financial service — server-authoritative money operations.
 * All mutations run through security-definer functions; reads are RLS-scoped
 * to the acting user (buyer's payments/ledger, seller's wallet/earnings).
 */

/** The acting user's wallet balance (0 when absent). */
export const getWalletForUser = cache(async (): Promise<Wallet> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wallets')
    .select('balance')
    .maybeSingle()
  if (error) {
    throw new Error('Gagal memuat saldo.')
  }
  return { balance: data?.balance ?? 0 }
})

/** Recent ledger entries for the acting user, newest first. */
export const getLedgerForUser = cache(
  async (limit = 30): Promise<LedgerEntry[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) {
      throw new Error('Gagal memuat riwayat keuangan.')
    }
    return (data ?? []).map(mapLedger)
  }
)

/** Payments for a given order (RLS-scoped to the buyer). */
export const getPaymentsForOrder = cache(
  async (orderId: string): Promise<Payment[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
    if (error) {
      throw new Error('Gagal memuat pembayaran.')
    }
    return (data ?? []).map(mapPayment)
  }
)

/** Seller earnings for the acting merchant, newest first. */
export const getEarningsForUser = cache(
  async (limit = 50): Promise<SellerEarning[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('seller_earnings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) {
      throw new Error('Gagal memuat pendapatan.')
    }
    return (data ?? []).map(mapEarning)
  }
)

/** Withdrawals for the acting user, newest first. */
export const getWithdrawalsForUser = cache(
  async (): Promise<Withdrawal[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      throw new Error('Gagal memuat penarikan.')
    }
    return (data ?? []).map(mapWithdrawal)
  }
)

/** Admin: all withdrawals, optionally filtered by status. */
export async function getWithdrawalsByStatus(
  status?: WithdrawalStatus
): Promise<Withdrawal[]> {
  const supabase = await createClient()
  let q = supabase.from('withdrawals').select('*')
  if (status) q = q.eq('status', status)
  const { data, error } = await q.order('created_at', { ascending: true })
  if (error) {
    throw new Error('Gagal memuat daftar penarikan.')
  }
  return (data ?? []).map(mapWithdrawal)
}

/** Buyer pays for their PENDING order. */
export async function payOrder(
  orderId: string,
  method: PaymentMethod
): Promise<string> {
  const supabase = await createClient()
  const { data: paymentId, error } = await supabase.rpc('pay_order', {
    p_order_id: orderId,
    p_method: method,
  })
  if (error) {
    throw new Error(mapFinanceError(error.code, error.message))
  }
  if (!paymentId) {
    throw new Error('Gagal memproses pembayaran.')
  }
  return paymentId
}

/** Seller requests a payout from their wallet. */
export async function requestWithdrawal(input: {
  amount: number
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
}): Promise<string> {
  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc('request_withdrawal', {
    p_amount: input.amount,
    p_bank_name: input.bankName,
    p_bank_account_number: input.bankAccountNumber,
    p_bank_account_name: input.bankAccountName,
  })
  if (error) {
    throw new Error(mapFinanceError(error.code, error.message))
  }
  if (!id) {
    throw new Error('Gagal mengajukan penarikan.')
  }
  return id
}

/** Admin approves a pending withdrawal. */
export async function approveWithdrawal(withdrawalId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('approve_withdrawal', {
    p_withdrawal_id: withdrawalId,
  })
  if (error) {
    throw new Error(mapFinanceError(error.code, error.message))
  }
}

/** Admin rejects a pending withdrawal, returning funds to the wallet. */
export async function rejectWithdrawal(
  withdrawalId: string,
  reason: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('reject_withdrawal', {
    p_withdrawal_id: withdrawalId,
    p_reason: reason,
  })
  if (error) {
    throw new Error(mapFinanceError(error.code, error.message))
  }
}

/** Maps common Postgres/RLS errors to friendly, user-safe messages. */
function mapFinanceError(code: string | null, message: string): string {
  switch (code) {
    case 'P0002':
      return message
    case '23514':
      return message
    case '42501':
      return 'Anda tidak memiliki izin untuk melakukan tindakan ini.'
    default:
      return 'Gagal memproses keuangan.'
  }
}
