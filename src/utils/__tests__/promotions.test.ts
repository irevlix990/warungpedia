import { describe, it, expect } from 'vitest'
import {
  applyFlashDiscount,
  flashSalePrice,
  voucherDiscount,
} from '../promotions'
import {
  voucherInputSchema,
  flashSaleInputSchema,
  voucherApplySchema,
} from '@/lib/validation/promotions'

describe('applyFlashDiscount', () => {
  it('subtracts a fixed amount', () => {
    expect(applyFlashDiscount(100000, 'AMOUNT', 25000)).toBe(75000)
  })

  it('clamps at zero for a large amount', () => {
    expect(applyFlashDiscount(10000, 'AMOUNT', 50000)).toBe(0)
  })

  it('floors the percent discount', () => {
    // 33% of 100 -> 33, floor keeps integer IDR
    expect(applyFlashDiscount(100, 'PERCENT', 33)).toBe(67)
  })
})

describe('flashSalePrice', () => {
  it('returns the original price when there is no sale', () => {
    expect(flashSalePrice(50000, null)).toBe(50000)
  })

  it('returns the discounted price for an active sale', () => {
    expect(flashSalePrice(200000, { discountType: 'PERCENT', discountValue: 50 })).toBe(100000)
  })
})

describe('voucherDiscount', () => {
  it('applies a fixed-amount discount less than the subtotal', () => {
    expect(voucherDiscount(100000, 'AMOUNT', 25000, null)).toBe(25000)
  })

  it('rejects a fixed amount that wipes the whole subtotal', () => {
    expect(voucherDiscount(10000, 'AMOUNT', 25000, null)).toBe(0)
  })

  it('floors percent and respects the max discount cap', () => {
    expect(voucherDiscount(200000, 'PERCENT', 10, 15000)).toBe(15000)
  })

  it('refuses a discount that wipes the whole subtotal', () => {
    expect(voucherDiscount(100000, 'PERCENT', 100, null)).toBe(0)
  })
})

describe('voucherApplySchema', () => {
  it('accepts a (long) code or empty string', () => {
    expect(voucherApplySchema.safeParse({ voucherCode: 'HEMAT10' }).success).toBe(true)
    expect(voucherApplySchema.safeParse({ voucherCode: '' }).success).toBe(true)
  })

  it('rejects an oversized code', () => {
    expect(
      voucherApplySchema.safeParse({ voucherCode: 'X'.repeat(40) }).success
    ).toBe(false)
  })
})

describe('voucherInputSchema', () => {
  it('accepts a valid percent voucher', () => {
    const r = voucherInputSchema.safeParse({
      discountType: 'PERCENT',
      discountValue: 10,
      minSpend: 150000,
      perUserLimit: 1,
    })
    expect(r.success).toBe(true)
  })

  it('rejects percent above 100', () => {
    const r = voucherInputSchema.safeParse({
      discountType: 'PERCENT',
      discountValue: 101,
    })
    expect(r.success).toBe(false)
  })

  it('accepts a fixed-amount voucher at 100%+ magnitudes', () => {
    const r = voucherInputSchema.safeParse({
      discountType: 'AMOUNT',
      discountValue: 100000,
    })
    expect(r.success).toBe(true)
  })
})

describe('flashSaleInputSchema', () => {
  it('rejects percent above 100', () => {
    const r = flashSaleInputSchema.safeParse({
      discountType: 'PERCENT',
      discountValue: 110,
    })
    expect(r.success).toBe(false)
  })
})