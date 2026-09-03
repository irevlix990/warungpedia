import { describe, expect, it } from 'vitest'
import { addToCartSchema, updateCartItemSchema } from '@/lib/validation/cart'

const UUID = '00000000-0000-4000-8000-000000000001'

describe('addToCartSchema', () => {
  it('accepts a valid product id and quantity', () => {
    const r = addToCartSchema.safeParse({
      productId: UUID,
      quantity: 3,
    })
    expect(r.success).toBe(true)
  })

  it('rejects invalid product id', () => {
    const r = addToCartSchema.safeParse({ productId: 'nope', quantity: 1 })
    expect(r.success).toBe(false)
  })

  it('rejects out-of-range or non-integer quantity', () => {
    expect(addToCartSchema.safeParse({ productId: UUID, quantity: 0 }).success).toBe(false)
    expect(addToCartSchema.safeParse({ productId: UUID, quantity: 100 }).success).toBe(false)
    expect(addToCartSchema.safeParse({ productId: UUID, quantity: 1.5 }).success).toBe(false)
  })
})

describe('updateCartItemSchema', () => {
  it('accepts a valid item id and quantity', () => {
    expect(updateCartItemSchema.safeParse({ itemId: UUID, quantity: 2 }).success).toBe(true)
  })

  it('rejects an invalid item id', () => {
    expect(updateCartItemSchema.safeParse({ itemId: 'x', quantity: 2 }).success).toBe(false)
  })

  it('rejects quantity of zero or negative', () => {
    expect(updateCartItemSchema.safeParse({ itemId: UUID, quantity: 0 }).success).toBe(false)
    expect(updateCartItemSchema.safeParse({ itemId: UUID, quantity: -1 }).success).toBe(false)
  })
})
