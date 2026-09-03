import { describe, expect, it } from 'vitest'
import { productSchema } from '@/lib/validation/product'

const base = {
  name: 'Kemeja Pria Polos',
  slug: 'kemeja-pria-polos',
  description: 'Kemeja katun berkualitas.',
  brand: 'MerekX',
  condition: 'new',
  price: 150000,
  compareAtPrice: null,
  imageUrls: ['https://example.com/kemeja.jpg'],
  stock: 20,
  lowStockThreshold: 5,
  weightGrams: 250,
  status: 'DRAFT' as const,
  isFeatured: false,
}

describe('productSchema', () => {
  it('accepts a fully valid product', () => {
    expect(productSchema.safeParse(base).success).toBe(true)
  })

  it('accepts a blank slug (derived later)', () => {
    expect(productSchema.safeParse({ ...base, slug: '' }).success).toBe(true)
  })

  it('rejects a name that is too short', () => {
    expect(productSchema.safeParse({ ...base, name: 'AB' }).success).toBe(
      false
    )
  })

  it('rejects an invalid slug format', () => {
    expect(productSchema.safeParse({ ...base, slug: 'Kemeja!' }).success).toBe(
      false
    )
  })

  it('rejects negative price', () => {
    expect(productSchema.safeParse({ ...base, price: -1 }).success).toBe(
      false
    )
  })

  it('rejects non-integer price', () => {
    expect(productSchema.safeParse({ ...base, price: 1000.5 }).success).toBe(
      false
    )
  })

  it('rejects a compare-at price not greater than price', () => {
    expect(
      productSchema.safeParse({ ...base, compareAtPrice: 150000 }).success
    ).toBe(false)
    expect(
      productSchema.safeParse({ ...base, compareAtPrice: 100000 }).success
    ).toBe(false)
  })

  it('accepts a compare-at price greater than price', () => {
    expect(
      productSchema.safeParse({ ...base, compareAtPrice: 200000 }).success
    ).toBe(true)
  })

  it('rejects negative stock and weight', () => {
    expect(productSchema.safeParse({ ...base, stock: -5 }).success).toBe(
      false
    )
    expect(productSchema.safeParse({ ...base, weightGrams: -1 }).success).toBe(
      false
    )
  })

  it('rejects unknown condition and status', () => {
    expect(
      productSchema.safeParse({ ...base, condition: 'refurbished' }).success
    ).toBe(false)
    expect(
      productSchema.safeParse({ ...base, status: 'DELETED' }).success
    ).toBe(false)
  })

  it('rejects a malformed image URL', () => {
    expect(
      productSchema.safeParse({
        ...base,
        imageUrls: ['not-a-url'],
      }).success
    ).toBe(false)
  })

  it('accepts blank entries inside imageUrls', () => {
    expect(
      productSchema.safeParse({ ...base, imageUrls: [''] }).success
    ).toBe(true)
  })
})
