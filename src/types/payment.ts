export const PAYMENT_METHODS = ['WALLET', 'BANK_TRANSFER', 'COD'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_STATUSES = ['PENDING', 'SUCCEEDED', 'FAILED'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const LEDGER_TYPES = [
  'SALE',
  'COMMISSION',
  'WITHDRAWAL',
  'PAYMENT',
  'REFUND',
  'ADJUSTMENT',
] as const
export type LedgerType = (typeof LEDGER_TYPES)[number]

export const EARNING_STATUSES = ['AVAILABLE', 'PAID_OUT', 'REFUNDED'] as const
export type EarningStatus = (typeof EARNING_STATUSES)[number]

export const WITHDRAWAL_STATUSES = [
  'PENDING',
  'PROCESSING',
  'PAID',
  'REJECTED',
] as const
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number]

/** A buyer's payment for an order. */
export interface Payment {
  id: string
  orderId: string
  userId: string
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  reference: string | null
  paidAt: string | null
  createdAt: string
}

/** A seller's wallet balance + recent history. */
export interface Wallet {
  balance: number
}

/** An immutable wallet movement for display/reconciliation. */
export interface LedgerEntry {
  id: string
  amount: number
  type: LedgerType
  referenceType: string | null
  description: string | null
  createdAt: string
}

/** Marketplace revenue recognized on a paid order for one seller. */
export interface SellerEarning {
  id: string
  orderId: string
  storeId: string
  gross: number
  commission: number
  net: number
  status: EarningStatus
  createdAt: string
}

/** A seller payout request. */
export interface Withdrawal {
  id: string
  userId: string
  amount: number
  status: WithdrawalStatus
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  rejectionReason: string | null
  createdAt: string
}

/** Display parts derived from a gross figure + commission (integer IDR). */
export interface EarningBreakdown {
  gross: number
  commission: number
  net: number
  commissionLabel: string
  netLabel: string
}
