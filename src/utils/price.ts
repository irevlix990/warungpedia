import { formatIDR } from './cn'

export interface PriceBreakdown {
  price: number
  priceLabel: string
  originalPrice: number | null
  originalLabel: string | null
  discountPercent: number | null
}

/**
 * Derives display parts for a product's final selling price.
 *
 * `price` is always the integer IDR amount the buyer pays (set server-side).
 * When a discount percentage is given, the original (pre-discount) price is
 * derived from it so cards can show a strikethrough reference. Discounts are
 * floored to a whole percent and only honored within 1..99.
 */
export function computePriceBreakdown(
  price: number,
  discountPercent: number | null
): PriceBreakdown {
  const discount =
    discountPercent !== null &&
    discountPercent > 0 &&
    discountPercent < 100
      ? Math.floor(discountPercent)
      : null

  const originalPrice =
    discount === null ? null : Math.round(price / (1 - discount / 100))

  return {
    price,
    priceLabel: formatIDR(price),
    originalPrice,
    originalLabel: originalPrice === null ? null : formatIDR(originalPrice),
    discountPercent: discount,
  }
}