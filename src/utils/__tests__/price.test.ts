import { describe, expect, it } from 'vitest'
import { computePriceBreakdown } from '@/utils/price'

describe('computePriceBreakdown', () => {
  it('returns the plain price when no discount', () => {
    const result = computePriceBreakdown(100000, null)
    expect(result.priceLabel).toBe('Rp100.000')
    expect(result.originalPrice).toBeNull()
    expect(result.originalLabel).toBeNull()
    expect(result.discountPercent).toBeNull()
  })

  it('derives the original price from a discount percent', () => {
    const result = computePriceBreakdown(80000, 20)
    expect(result.priceLabel).toBe('Rp80.000')
    expect(result.originalPrice).toBe(100000)
    expect(result.originalLabel).toBe('Rp100.000')
    expect(result.discountPercent).toBe(20)
  })

  it('floors fractional discount percents', () => {
    expect(computePriceBreakdown(100000, 12.9).discountPercent).toBe(12)
  })

  it('ignores out-of-range discounts', () => {
    expect(computePriceBreakdown(100000, 0).discountPercent).toBeNull()
    expect(computePriceBreakdown(100000, 100).discountPercent).toBeNull()
    expect(computePriceBreakdown(100000, -5).discountPercent).toBeNull()
  })

  it('keeps price integer and original consistent', () => {
    const result = computePriceBreakdown(850000, 15)
    const expectedOriginal = Math.round(850000 / (1 - 15 / 100))
    expect(result.originalPrice).toBe(expectedOriginal)
    expect(result.price).toBe(850000)
  })
})