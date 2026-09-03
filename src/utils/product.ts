import { formatIDR } from './cn'
import { computePriceBreakdown } from './price'

export type StockLevel = 'out' | 'low' | 'in'

/**
 * Classifies inventory for display/badging.
 *   - `/out`  → stock 0 (or negative safety) — sold out
 *   - `/low`  → stock > 0 and <= lowStockThreshold — "almost gone"
 *   - `/in`   → otherwise
 */
export function stockLevel(
  stock: number,
  lowStockThreshold: number
): StockLevel {
  if (stock <= 0) return 'out'
  if (stock <= lowStockThreshold) return 'low'
  return 'in'
}

export const STOCK_LEVEL_LABEL: Record<StockLevel, string> = {
  out: 'Habis',
  low: 'Sisa sedikit',
  in: 'Tersedia',
}

/** Primary product thumbnail; falls back to the first uploaded image. */
export function productThumbnail(imageUrls: string[]): string | null {
  return imageUrls.length > 0 ? imageUrls[0] : null
}

export interface ProductPriceParts {
  priceLabel: string
  originalLabel: string | null
  discountPercent: number | null
}

/**
 * Pure display breakdown for a product's price, reusing the integer-IDR
 * price utility so cards and detail pages show consistent labels.
 */
export function productPriceParts(
  price: number,
  compareAtPrice: number | null
): ProductPriceParts {
  if (compareAtPrice && compareAtPrice > price) {
    const discount = Math.round(
      (1 - price / compareAtPrice) * 100
    )
    return {
      priceLabel: formatIDR(price),
      originalLabel: formatIDR(compareAtPrice),
      discountPercent: discount,
    }
  }
  return {
    priceLabel: formatIDR(price),
    originalLabel: null,
    discountPercent: null,
  }
}

export { computePriceBreakdown }
