import type { DiscountType } from '@/types/promotions'

/**
 * Promotion discount math (integer IDR). Across flash sales and vouchers the
 * database definers are authoritative for money at checkout; these pure
 * helpers mirror the same rules for display only (search, cart previews) so
 * the price a buyer sees matches what they pay. All percent math rounds DOWN
 * (floor), identical to the SQL.
 */

/** The integer discount a flash sale yields on a price (or 0). */
export function applyFlashDiscount(
  price: number,
  discountType: DiscountType,
  discountValue: number
): number {
  if (discountType === 'AMOUNT') {
    return Math.max(price - discountValue, 0)
  }
  return Math.max(price - Math.floor((price * discountValue) / 100), 0)
}

/** The flash-sale price of a product (or the original price if no sale). */
export function flashSalePrice(
  price: number,
  sale?: { discountType: DiscountType; discountValue: number } | null
): number {
  if (!sale) return price
  return applyFlashDiscount(price, sale.discountType, sale.discountValue)
}

/** The voucher discount (amount or capped percent) given a subtotal. */
export function voucherDiscount(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number,
  maxDiscount: number | null
): number {
  let discount: number
  if (discountType === 'AMOUNT') {
    discount = Math.min(discountValue, subtotal)
  } else {
    discount = Math.floor((subtotal * discountValue) / 100)
    if (maxDiscount != null && discount > maxDiscount) {
      discount = maxDiscount
    }
  }
  // A discount cannot wipe out the whole value (total must remain > 0).
  if (discount >= subtotal) return 0
  return discount
}