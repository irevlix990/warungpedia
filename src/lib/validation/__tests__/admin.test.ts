import { describe, it, expect } from 'vitest'
import {
  setUserRoleSchema,
  moderateProductSchema,
  setReviewStatusSchema,
  categorySchema,
  siteSettingsSchema,
} from '../admin'

const UUID = '00000000-0000-4000-8000-000000000001'

describe('setUserRoleSchema', () => {
  it('accepts a valid role assignment', () => {
    const r = setUserRoleSchema.safeParse({ userId: UUID, role: 'SELLER' })
    expect(r.success).toBe(true)
  })

  it('rejects an unknown role', () => {
    expect(setUserRoleSchema.safeParse({ userId: UUID, role: 'BOSS' }).success).toBe(false)
  })

  it('rejects a non-uuid user id', () => {
    expect(setUserRoleSchema.safeParse({ userId: 'nope', role: 'ADMIN' }).success).toBe(false)
  })
})

describe('moderateProductSchema', () => {
  it('accepts a status-only update', () => {
    const r = moderateProductSchema.safeParse({ productId: UUID, status: 'ARCHIVED' })
    expect(r.success).toBe(true)
  })

  it('transforms the featured checkbox to a boolean', () => {
    const r = moderateProductSchema.safeParse({
      productId: UUID,
      status: 'ACTIVE',
      featured: 'true',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.featured).toBe(true)
  })

  it('rejects an invalid status', () => {
    expect(moderateProductSchema.safeParse({ productId: UUID, status: 'GONE' }).success).toBe(false)
  })

  it('rejects a non-uuid product id', () => {
    expect(moderateProductSchema.safeParse({ productId: 'xx' }).success).toBe(false)
  })
})

describe('setReviewStatusSchema', () => {
  it('accepts ACTIVE/HIDDEN', () => {
    expect(setReviewStatusSchema.safeParse({ reviewId: UUID, status: 'HIDDEN' }).success).toBe(true)
    expect(setReviewStatusSchema.safeParse({ reviewId: UUID, status: 'ACTIVE' }).success).toBe(true)
  })

  it('rejects unknown statuses', () => {
    expect(setReviewStatusSchema.safeParse({ reviewId: UUID, status: 'DELETED' }).success).toBe(false)
  })
})

describe('categorySchema', () => {
  it('accepts a valid category', () => {
    const r = categorySchema.safeParse({
      name: 'Elektronik',
      slug: 'elektronik',
      sortOrder: '2',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.sortOrder).toBe(2)
      expect(r.data.parentId).toBeNull()
      expect(r.data.description).toBeNull()
    }
  })

  it('rejects an empty name', () => {
    expect(categorySchema.safeParse({ name: ' ', slug: 'elektronik' }).success).toBe(false)
  })

  it('rejects an invalid slug', () => {
    expect(categorySchema.safeParse({ name: 'X', slug: 'Elektronik' }).success).toBe(false)
    expect(categorySchema.safeParse({ name: 'X', slug: 'elektronik_2' }).success).toBe(false)
  })

  it('accepts a kebab-case slug', () => {
    expect(categorySchema.safeParse({ name: 'X', slug: 'elektronik-2' }).success).toBe(true)
  })

  it('rejects a bad image url', () => {
    expect(
      categorySchema.safeParse({ name: 'X', slug: 'x', imageUrl: 'not-a-url' }).success
    ).toBe(false)
  })
})

describe('siteSettingsSchema', () => {
  it('accepts valid site settings', () => {
    const r = siteSettingsSchema.safeParse({
      siteName: 'Warungpedia',
      tagline: 'Belanja lokal',
      supportEmail: 'support@warungpedia.id',
      about: 'Tentang kami',
    })
    expect(r.success).toBe(true)
  })

  it('rejects an empty site name', () => {
    expect(
      siteSettingsSchema.safeParse({ siteName: '', supportEmail: 'a@b.co' }).success
    ).toBe(false)
  })

  it('rejects an invalid support email', () => {
    expect(
      siteSettingsSchema.safeParse({ siteName: 'X', supportEmail: 'nope' }).success
    ).toBe(false)
  })
})
