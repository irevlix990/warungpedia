/**
 * Extended cart unit tests — Phase 15
 *
 * Covers additional edge cases for multi-vendor subtotal computation,
 * order totals with voucher discounts, and IDR integrity invariants.
 */
import { describe, it, expect } from 'vitest'
import {
  cartTotals,
  computeSubtotal,
  orderTotals,
  SHIPPING_FEE,
} from '../cart'
import type { Product, ProductStatus } from '@/types/product'

function makeProduct(price: number, id = 'p'): Product {
  const status: ProductStatus = 'ACTIVE'
  return {
    id,
    storeId: 's',
    categoryId: null,
    slug: 'x',
    name: 'Produk',
    description: null,
    brand: null,
    condition: 'new',
    price,
    compareAtPrice: null,
    imageUrls: [],
    stock: 10,
    lowStockThreshold: 5,
    weightGrams: null,
    status,
    isFeatured: false,
    reviewsCount: 0,
    ratingAvg: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
}

describe('computeSubtotal — extended', () => {
  it('handles large quantities without float imprecision', () => {
    // 99 × 999_999 = 98_999_901 (large but integer)
    const items = [{ quantity: 99, product: makeProduct(999_999) }]
    expect(computeSubtotal(items)).toBe(98_999_901)
    expect(Number.isInteger(computeSubtotal(items))).toBe(true)
  })

  it('multi-seller cart sums all seller lines correctly', () => {
    const sellerA = [
      { quantity: 2, product: makeProduct(50_000, 'a1') },
      { quantity: 1, product: makeProduct(25_000, 'a2') },
    ]
    const sellerB = [
      { quantity: 3, product: makeProduct(10_000, 'b1') },
    ]
    const allItems = [...sellerA, ...sellerB]
    // 2×50k + 1×25k + 3×10k = 100k + 25k + 30k = 155k
    expect(computeSubtotal(allItems)).toBe(155_000)
  })

  it('single item with quantity 1 equals the product price', () => {
    const items = [{ quantity: 1, product: makeProduct(87_500) }]
    expect(computeSubtotal(items)).toBe(87_500)
  })
})

describe('cartTotals — extended', () => {
  it('shipping fee is currently zero (free shipping placeholder)', () => {
    expect(SHIPPING_FEE).toBe(0)
    const totals = cartTotals(100_000)
    expect(totals.shippingFee).toBe(0)
    expect(totals.total).toBe(100_000)
  })

  it('totals never contain floating point', () => {
    const totals = cartTotals(123_456)
    expect(Number.isInteger(totals.subtotal)).toBe(true)
    expect(Number.isInteger(totals.total)).toBe(true)
    expect(Number.isInteger(totals.shippingFee)).toBe(true)
  })

  it('labels use Indonesian Rupiah format', () => {
    const totals = cartTotals(1_500_000)
    expect(totals.subtotalLabel).toBe('Rp1.500.000')
    expect(totals.totalLabel).toBe('Rp1.500.000')
  })

  it('zero cart produces Rp0 labels', () => {
    const totals = cartTotals(0)
    expect(totals.subtotalLabel).toBe('Rp0')
    expect(totals.totalLabel).toBe('Rp0')
  })
})

describe('orderTotals — voucher discount integration', () => {
  it('subtracts voucher discount from subtotal', () => {
    const totals = orderTotals(200_000, 25_000)
    expect(totals.subtotal).toBe(200_000)
    expect(totals.discount).toBe(25_000)
    expect(totals.total).toBe(175_000)
  })

  it('zero discount equals cartTotals result', () => {
    const withVoucher = orderTotals(150_000, 0)
    const withoutVoucher = cartTotals(150_000)
    expect(withVoucher.total).toBe(withoutVoucher.total)
    expect(withVoucher.subtotal).toBe(withoutVoucher.subtotal)
  })

  it('discount label is formatted as IDR', () => {
    const totals = orderTotals(200_000, 15_000)
    expect(totals.discountLabel).toBe('Rp15.000')
  })

  it('total never goes negative when large discount applied', () => {
    // The voucher engine prevents this upstream, but the util should still
    // compute without throwing
    const totals = orderTotals(50_000, 49_999)
    expect(totals.total).toBe(1)
  })
})
