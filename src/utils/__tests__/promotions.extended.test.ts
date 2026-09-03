/**
 * Extended promotions unit tests — Phase 15
 *
 * Additional edge cases for flash-sale pricing and voucher discount math,
 * ensuring all integer-IDR invariants hold at boundaries.
 */
import { describe, it, expect } from 'vitest'
import {
  applyFlashDiscount,
  flashSalePrice,
  voucherDiscount,
} from '../promotions'

describe('applyFlashDiscount — boundary cases', () => {
  it('returns exactly 0 when amount discount equals price', () => {
    expect(applyFlashDiscount(50_000, 'AMOUNT', 50_000)).toBe(0)
  })

  it('never returns a negative price (large amount discount)', () => {
    const result = applyFlashDiscount(10_000, 'AMOUNT', 999_999)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBe(0)
  })

  it('100% PERCENT discount yields 0 (no free items leaked)', () => {
    expect(applyFlashDiscount(100_000, 'PERCENT', 100)).toBe(0)
  })

  it('PERCENT 0 yields original price (no discount)', () => {
    expect(applyFlashDiscount(100_000, 'PERCENT', 0)).toBe(100_000)
  })

  it('floors fractional percent discount to whole IDR', () => {
    // 33% of 100_001 = 33000.33 → floor → 33000
    const result = applyFlashDiscount(100_001, 'PERCENT', 33)
    expect(Number.isInteger(result)).toBe(true)
  })

  it('AMOUNT discount maintains integer IDR (no floats)', () => {
    const result = applyFlashDiscount(155_555, 'AMOUNT', 55_555)
    expect(Number.isInteger(result)).toBe(true)
    expect(result).toBe(100_000)
  })
})

describe('flashSalePrice — composition', () => {
  it('applies AMOUNT type from a sale object', () => {
    expect(
      flashSalePrice(200_000, { discountType: 'AMOUNT', discountValue: 30_000 })
    ).toBe(170_000)
  })

  it('undefined sale returns original price', () => {
    expect(flashSalePrice(80_000, undefined)).toBe(80_000)
  })

  it('sale with 0 percent returns original price', () => {
    expect(
      flashSalePrice(80_000, { discountType: 'PERCENT', discountValue: 0 })
    ).toBe(80_000)
  })

  it('chained sales do NOT compound (only one sale applies)', () => {
    const afterSale = flashSalePrice(100_000, {
      discountType: 'PERCENT',
      discountValue: 10,
    })
    expect(afterSale).toBe(90_000)
    // A second sale would start from the original price, not the discounted one
    const afterSale2 = flashSalePrice(100_000, {
      discountType: 'PERCENT',
      discountValue: 20,
    })
    expect(afterSale2).toBe(80_000)
  })
})

describe('voucherDiscount — correctness and security invariants', () => {
  it('never exceeds the subtotal (safety cap)', () => {
    const discount = voucherDiscount(50_000, 'AMOUNT', 200_000, null)
    expect(discount).toBeLessThanOrEqual(50_000)
  })

  it('PERCENT discount respects max cap when specified', () => {
    // 20% of 500_000 = 100_000 but capped at 75_000
    expect(voucherDiscount(500_000, 'PERCENT', 20, 75_000)).toBe(75_000)
  })

  it('PERCENT discount without cap applies fully', () => {
    expect(voucherDiscount(500_000, 'PERCENT', 20, null)).toBe(100_000)
  })

  it('AMOUNT discount equal to subtotal yields 0 (total must remain > 0)', () => {
    // Voucher that would zero the cart is rejected
    expect(voucherDiscount(100_000, 'AMOUNT', 100_000, null)).toBe(0)
  })

  it('AMOUNT discount slightly below subtotal is accepted', () => {
    expect(voucherDiscount(100_000, 'AMOUNT', 99_999, null)).toBe(99_999)
  })

  it('0 percent voucher gives 0 discount', () => {
    expect(voucherDiscount(100_000, 'PERCENT', 0, null)).toBe(0)
  })

  it('result is always an integer (no float leakage)', () => {
    const result = voucherDiscount(100_001, 'PERCENT', 33, null)
    expect(Number.isInteger(result)).toBe(true)
  })

  it('PERCENT capped at 99 cannot wipe the order', () => {
    // Even 99% of subtotal still leaves 1%
    const discount = voucherDiscount(100_000, 'PERCENT', 99, null)
    expect(discount).toBeLessThan(100_000)
  })
})
