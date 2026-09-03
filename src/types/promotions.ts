export const DISCOUNT_TYPES = ['PERCENT', 'AMOUNT'] as const

export type DiscountType = (typeof DISCOUNT_TYPES)[number]

/** An admin-issued discount code (mapped from `vouchers` rows). */
export interface Voucher {
  id: string
  code: string
  description: string | null
  discountType: DiscountType
  discountValue: number
  minSpend: number
  maxDiscount: number | null
  perUserLimit: number
  totalUsageLimit: number | null
  usesCount: number
  isActive: boolean
  startsAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

/** Same shape as a validated voucher create/edit form submission. */
export interface VoucherInput {
  description?: string | null
  discountType: DiscountType
  discountValue: number
  minSpend?: number
  maxDiscount?: number | null
  perUserLimit?: number
  totalUsageLimit?: number | null
  isActive?: boolean
  startsAt?: string | null
  expiresAt?: string | null
}

/** A single voucher redemption (for admin audit / buyer history). */
export interface VoucherRedemption {
  id: string
  voucherId: string
  userId: string
  orderId: string
  discountAmount: number
  createdAt: string
}

/** An admin-scheduled, time-limited per-product discount. */
export interface FlashSale {
  id: string
  productId: string
  productName?: string | null
  discountType: DiscountType
  discountValue: number
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  createdAt: string
  updatedAt: string
}

/** Same shape as a validated flash-sale create/edit form submission. */
export interface FlashSaleInput {
  discountType: DiscountType
  discountValue: number
  isActive?: boolean
  startsAt?: string | null
  endsAt?: string | null
}

/** Result of the read-only `validate_voucher` definer (display helper). */
export interface VoucherValidationResult {
  voucherId: string | null
  discount: number
  message: string | null
}