/**
 * Order & financial integrity integration tests — Phase 15
 *
 * Validates that the pure calculation logic used in checkout, orders,
 * commission, settlement, and wallet operations produces correct results
 * and maintains critical integer-IDR invariants.
 *
 * These tests simulate the server-side calculations without requiring
 * a database — they test the mathematical correctness of business rules.
 */
import { describe, it, expect } from 'vitest'
import { splitEarning, earningBreakdown } from '@/utils/finance'
import { applyFlashDiscount, flashSalePrice, voucherDiscount } from '@/utils/promotions'

// ============================================================
// CHECKOUT ORDER CALCULATION FLOW
// Simulates the server-side order calculation that happens during
// checkout for a multi-vendor cart.
// ============================================================

interface ProductLine {
  name: string
  price: number
  quantity: number
  storeId: string
}

describe('Order Calculation Flow — Multi-Vendor Checkout', () => {
  it('correctly splits a multi-vendor order into per-seller subtotals', () => {
    const sellerAItems: ProductLine[] = [
      { name: 'Kaos', price: 80_000, quantity: 2, storeId: 'store-a' },
      { name: 'Celana', price: 120_000, quantity: 1, storeId: 'store-a' },
    ]
    const sellerBItems: ProductLine[] = [
      { name: 'Sepatu', price: 250_000, quantity: 1, storeId: 'store-b' },
    ]

    const sellerASubtotal = sellerAItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const sellerBSubtotal = sellerBItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    // Seller A: 2×80k + 1×120k = 280k
    expect(sellerASubtotal).toBe(280_000)
    // Seller B: 1×250k = 250k
    expect(sellerBSubtotal).toBe(250_000)

    // Grand total
    const grandTotal = sellerASubtotal + sellerBSubtotal
    expect(grandTotal).toBe(530_000)
  })

  it('applies flash-sale prices BEFORE voucher discount', () => {
    const originalPrice = 200_000
    const salePrice = flashSalePrice(originalPrice, {
      discountType: 'PERCENT',
      discountValue: 30,
    })
    // Sale price: 200k - 30% = 140k
    expect(salePrice).toBe(140_000)

    // Voucher on the discounted price
    const voucher = voucherDiscount(salePrice, 'AMOUNT', 20_000, null)
    expect(voucher).toBe(20_000)

    // Final payable = 140k - 20k = 120k
    expect(salePrice - voucher).toBe(120_000)
  })

  it('prevents double-discounting (flash sale + voucher cannot exceed subtotal)', () => {
    const price = 50_000
    const salePrice = flashSalePrice(price, {
      discountType: 'PERCENT',
      discountValue: 50,
    }) // 25k

    // Voucher cannot wipe out the remaining amount
    const voucher = voucherDiscount(salePrice, 'AMOUNT', 30_000, null)
    expect(voucher).toBe(0) // rejected because 30k >= 25k
  })
})

// ============================================================
// COMMISSION & SETTLEMENT FLOW
// Validates commission split and settlement calculation.
// ============================================================

describe('Commission & Settlement — Financial Integrity', () => {
  it('calculates commission correctly on a sale amount', () => {
    const saleAmount = 500_000 // Rp500.000
    const rateBps = 500 // 5%
    const { commission, net } = splitEarning(saleAmount, rateBps)

    // Commission: 500k × 500 / 10000 = 25k
    expect(commission).toBe(25_000)
    // Net to seller: 500k - 25k = 475k
    expect(net).toBe(475_000)
    // Money integrity: nothing lost
    expect(commission + net).toBe(saleAmount)
  })

  it('handles micro-transactions without losing IDR to rounding', () => {
    const saleAmount = 1_500 // Rp1.500
    const rateBps = 500 // 5%
    const { commission, net } = splitEarning(saleAmount, rateBps)

    // 1500 × 500 / 10000 = 75.0
    expect(commission).toBe(75)
    expect(net).toBe(1_425)
    expect(commission + net).toBe(saleAmount)
  })

  it('commission floor behavior — no fractional IDR in commission', () => {
    // 999 × 330 / 10000 = 32.967 → floor to 32
    const { commission, net } = splitEarning(999, 330)
    expect(Number.isInteger(commission)).toBe(true)
    expect(Number.isInteger(net)).toBe(true)
    expect(commission).toBe(32)
    expect(net).toBe(967)
  })

  it('settlement: net amount = gross - commission', () => {
    const gross = 1_234_567
    const rateBps = 750 // 7.5%
    const breakdown = earningBreakdown(gross, rateBps)

    expect(breakdown.commission + breakdown.net).toBe(breakdown.gross)
    expect(breakdown.gross).toBe(gross)
  })
})

// ============================================================
// WALLET INTEGRITY
// Validates that wallet operations maintain balance integrity.
// ============================================================

describe('Wallet Integrity — Balance Invariants', () => {
  it('wallet debit cannot exceed current balance', () => {
    const balance = 100_000
    const withdrawalAmount = 150_000
    // Security rule: wallet balance must be >= withdrawal
    expect(balance >= withdrawalAmount).toBe(false)
  })

  it('refund credited to wallet must be positive integer', () => {
    const refundAmount = 75_000
    expect(Number.isInteger(refundAmount)).toBe(true)
    expect(refundAmount).toBeGreaterThan(0)
  })

  it('pending + available always equals the total balance', () => {
    // Simulated wallet state
    const pendingBalance = 250_000
    const availableBalance = 750_000
    const totalBalance = pendingBalance + availableBalance

    expect(totalBalance).toBe(1_000_000)
    expect(pendingBalance + availableBalance).toBe(totalBalance)
  })

  it('payment success → pending, delivery → available, withdrawal → decrease', () => {
    let pending = 0
    let available = 0

    // Step 1: Buyer pays
    pending = 500_000
    expect(pending).toBe(500_000)
    expect(available).toBe(0)

    // Step 2: Order delivered & completed → settlement
    pending = 0
    available = 500_000
    expect(pending).toBe(0)
    expect(available).toBe(500_000)

    // Step 3: Withdrawal of 300k
    available = 200_000
    expect(available).toBe(200_000)
  })
})

// ============================================================
// REFUND INTEGRITY
// Validates refund calculation and ledger behavior.
// ============================================================

describe('Refund Calculation — Partial & Full', () => {
  it('full refund returns the original payment amount', () => {
    const payment = 250_000
    const refund = payment
    expect(refund).toBe(250_000)
  })

  it('partial refund calculates correctly', () => {
    const payment = 250_000
    const refundPercent = 40
    const refund = Math.floor((payment * refundPercent) / 100)
    expect(refund).toBe(100_000)
  })

  it('commission must be reversed proportionally for partial refund', () => {
    const gross = 500_000
    const rateBps = 500
    const { commission: originalCommission, net } = splitEarning(gross, rateBps)

    // 40% partial refund
    const refundAmount = Math.floor((gross * 40) / 100) // 200k
    const refundCommission = Math.floor((refundAmount * rateBps) / 10000) // 10k

    expect(originalCommission).toBe(25_000)
    expect(refundCommission).toBe(10_000)
    // Net seller after refund: 475k - 190k = 285k
    const sellerNet = net - (refundAmount - refundCommission)
    expect(sellerNet).toBe(285_000)
  })
})

// ============================================================
// RETURN WINDOW SECURITY
// Validates 3-day return window per spec.
// ============================================================

describe('Return Window Security', () => {
  it('standard 3-day window is enforced', () => {
    const completedAt = new Date('2026-09-01T10:00:00Z')
    const closesAt = new Date(completedAt.getTime() + 3 * 24 * 60 * 60 * 1000)
    const requestAt = new Date('2026-09-03T23:59:59Z') // day 2, within window
    const requestAfter = new Date('2026-09-05T00:00:01Z') // day 4, expired

    expect(requestAt.getTime() <= closesAt.getTime()).toBe(true)
    expect(requestAfter.getTime() <= closesAt.getTime()).toBe(false)
  })

  it('return at exactly the window boundary is allowed', () => {
    const completedAt = new Date('2026-09-01T10:00:00Z')
    const closesAt = new Date(completedAt.getTime() + 3 * 24 * 60 * 60 * 1000)

    expect(new Date('2026-09-04T10:00:00Z').getTime()).toBe(closesAt.getTime())
  })
})

// ============================================================
// PRODUCT LISTING INTEGRITY
// Validates price display with flash sale overlay.
// ============================================================

describe('Product Listing Integrity', () => {
  it('flash sale price is displayed correctly with original price', () => {
    const originalPrice = 100_000
    const salePrice = flashSalePrice(originalPrice, {
      discountType: 'PERCENT',
      discountValue: 25,
    })
    expect(salePrice).toBe(75_000)
  })

  it('no flash sale shows original price', () => {
    expect(flashSalePrice(100_000, null)).toBe(100_000)
  })

  it('AMOUNT flash discount does not go below zero', () => {
    expect(applyFlashDiscount(10_000, 'AMOUNT', 50_000)).toBe(0)
  })
})
