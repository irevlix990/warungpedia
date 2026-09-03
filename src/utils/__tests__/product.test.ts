import { describe, expect, it } from 'vitest'
import {
  productPriceParts,
  productThumbnail,
  stockLevel,
} from '@/utils/product'

describe('stockLevel', () => {
  it('classifies zero/negative stock as out', () => {
    expect(stockLevel(0, 5)).toBe('out')
    expect(stockLevel(-1, 5)).toBe('out')
  })

  it('classifies stock at or below threshold as low', () => {
    expect(stockLevel(5, 5)).toBe('low')
    expect(stockLevel(1, 5)).toBe('low')
  })

  it('classifies stock above threshold as in', () => {
    expect(stockLevel(6, 5)).toBe('in')
  })
})

describe('productThumbnail', () => {
  it('returns the first image', () => {
    expect(productThumbnail(['a.jpg', 'b.jpg'])).toBe('a.jpg')
  })

  it('returns null for an empty list', () => {
    expect(productThumbnail([])).toBeNull()
  })
})

describe('productPriceParts', () => {
  it('shows plain price when no compare-at price', () => {
    const parts = productPriceParts(100000, null)
    expect(parts.priceLabel).toBe('Rp100.000')
    expect(parts.originalLabel).toBeNull()
    expect(parts.discountPercent).toBeNull()
  })

  it('ignores a compare-at price equal to or below the price', () => {
    expect(productPriceParts(100000, 100000).originalLabel).toBeNull()
    expect(productPriceParts(100000, 90000).originalLabel).toBeNull()
  })

  it('derives discount and shows both labels when compare-at exceeds price', () => {
    const parts = productPriceParts(80000, 100000)
    expect(parts.priceLabel).toBe('Rp80.000')
    expect(parts.originalLabel).toBe('Rp100.000')
    expect(parts.discountPercent).toBe(20)
  })
})
