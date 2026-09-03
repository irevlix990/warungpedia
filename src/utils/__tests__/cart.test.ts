import { describe, expect, it } from 'vitest'
import { cartTotals, computeSubtotal, SHIPPING_FEE } from '@/utils/cart'
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

describe('computeSubtotal', () => {
  it('sums price × quantity as integer IDR', () => {
    const items = [
      { quantity: 2, product: makeProduct(10000) },
      { quantity: 3, product: makeProduct(5000) },
    ]
    expect(computeSubtotal(items)).toBe(20000 + 15000)
  })

  it('returns 0 for an empty cart', () => {
    expect(computeSubtotal([])).toBe(0)
  })
})

describe('cartTotals', () => {
  it('derives integer totals with zero shipping', () => {
    const totals = cartTotals(25000)
    expect(totals.subtotal).toBe(25000)
    expect(totals.shippingFee).toBe(SHIPPING_FEE)
    expect(totals.total).toBe(25000)
  })

  it('produces Indonesian rupiah labels', () => {
    const totals = cartTotals(125000)
    expect(totals.subtotalLabel).toContain('Rp')
    expect(totals.totalLabel).toContain('Rp')
  })
})
