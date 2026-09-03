import { describe, it, expect } from 'vitest'
import {
  reviewSchema,
  reviewStatusSchema,
  createWishlistSchema,
  addWishlistItemSchema,
  toggleFollowSchema,
} from '../social'

const UUID = '00000000-0000-4000-8000-000000000001'

describe('reviewSchema', () => {
  it('accepts a valid review', () => {
    const r = reviewSchema.safeParse({
      orderId: UUID,
      productId: UUID,
      rating: '5',
      title: 'Bagus',
      body: 'Barang berkualitas.',
    })
    expect(r.success).toBe(true)
  })

  it('rejects an out-of-range rating', () => {
    expect(
      reviewSchema.safeParse({ orderId: UUID, productId: UUID, rating: '0', body: 'x' })
        .success
    ).toBe(false)
    expect(
      reviewSchema.safeParse({ orderId: UUID, productId: UUID, rating: '6', body: 'x' })
        .success
    ).toBe(false)
  })

  it('coerces a numeric string rating', () => {
    const r = reviewSchema.safeParse({
      orderId: UUID,
      productId: UUID,
      rating: '4',
      body: 'x',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.rating).toBe(4)
  })

  it('requires a non-empty body', () => {
    expect(
      reviewSchema.safeParse({ orderId: UUID, productId: UUID, rating: '5', body: '' })
        .success
    ).toBe(false)
  })

  it('rejects invalid uuids', () => {
    expect(
      reviewSchema.safeParse({
        orderId: 'not-a-uuid',
        productId: UUID,
        rating: '5',
        body: 'x',
      }).success
    ).toBe(false)
  })
})

describe('reviewStatusSchema', () => {
  it('accepts ACTIVE/HIDDEN', () => {
    expect(reviewStatusSchema.safeParse({ reviewId: UUID, status: 'HIDDEN' }).success).toBe(true)
    expect(reviewStatusSchema.safeParse({ reviewId: UUID, status: 'ACTIVE' }).success).toBe(true)
  })

  it('rejects unknown statuses', () => {
    expect(reviewStatusSchema.safeParse({ reviewId: UUID, status: 'REMOVED' }).success).toBe(false)
  })
})

describe('createWishlistSchema', () => {
  it('accepts a trimmed name', () => {
    expect(createWishlistSchema.safeParse({ name: '  Favorit  ' }).success).toBe(true)
  })

  it('rejects an empty or oversized name', () => {
    expect(createWishlistSchema.safeParse({ name: '   ' }).success).toBe(false)
    expect(createWishlistSchema.safeParse({ name: 'x'.repeat(81) }).success).toBe(false)
  })
})

describe('addWishlistItemSchema', () => {
  it('accepts a product id', () => {
    const r = addWishlistItemSchema.safeParse({ productId: UUID })
    expect(r.success).toBe(true)
  })

  it('accepts an optional wishlist id and notes', () => {
    const r = addWishlistItemSchema.safeParse({
      productId: UUID,
      wishlistId: UUID,
      notes: 'Hadiah',
    })
    expect(r.success).toBe(true)
  })

  it('rejects a non-uuid product id', () => {
    expect(addWishlistItemSchema.safeParse({ productId: 'bad' }).success).toBe(false)
  })
})

describe('toggleFollowSchema', () => {
  it('accepts a valid store id', () => {
    const r = toggleFollowSchema.safeParse({ storeId: UUID })
    expect(r.success).toBe(true)
  })

  it('rejects an invalid store id', () => {
    expect(toggleFollowSchema.safeParse({ storeId: 'nope' }).success).toBe(false)
  })
})
