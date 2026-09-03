import { formatIDR } from './cn'
import type { CartItem, CartTotals, OrderTotals } from '@/types/cart'

/** Flat shipping fee placeholder until the shipping phase. */
export const SHIPPING_FEE = 0

/** Computes the integer subtotal of a set of cart lines. */
export function computeSubtotal(items: Pick<CartItem, 'quantity' | 'product'>[]): number {
  return items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
}

/**
 * Derives display-friendly cart totals from the server-computed subtotal.
 * Money stays integer IDR; these strings are for presentation only.
 */
export function cartTotals(subtotal: number): CartTotals {
  const total = subtotal + SHIPPING_FEE
  return {
    subtotal,
    subtotalLabel: formatIDR(subtotal),
    shippingFee: SHIPPING_FEE,
    total,
    totalLabel: formatIDR(total),
  }
}

/**
 * Derives display-friendly order totals when a voucher discount was applied.
 * `subtotal` already reflects any flash-sale pricing; `discount` is the
 * voucher amount subtracted from the payable total.
 */
export function orderTotals(
  subtotal: number,
  discount: number
): OrderTotals {
  const total = subtotal - discount + SHIPPING_FEE
  return {
    subtotal,
    subtotalLabel: formatIDR(subtotal),
    discount,
    discountLabel: formatIDR(discount),
    shippingFee: SHIPPING_FEE,
    total,
    totalLabel: formatIDR(total),
  }
}
