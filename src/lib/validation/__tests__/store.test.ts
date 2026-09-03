import { describe, expect, it } from 'vitest'
import { storeSchema } from '@/lib/validation/store'

const base = {
  name: 'Toko Saya',
  slug: 'toko-saya',
  tagline: 'Toko terbaik',
  description: 'Menjual produk berkualitas.',
  contactEmail: 'toko@example.com',
  phone: '081234567890',
  province: 'DKI Jakarta',
  city: 'Jakarta Selatan',
  logoUrl: '',
  bannerUrl: '',
}

describe('storeSchema', () => {
  it('accepts a fully valid submission', () => {
    expect(storeSchema.safeParse(base).success).toBe(true)
  })

  it('accepts an empty slug (derived from name later)', () => {
    expect(storeSchema.safeParse({ ...base, slug: '' }).success).toBe(true)
  })

  it('rejects a name that is too short', () => {
    expect(storeSchema.safeParse({ ...base, name: 'AB' }).success).toBe(false)
  })

  it('rejects an invalid slug format', () => {
    expect(
      storeSchema.safeParse({ ...base, slug: 'Toko Saya!' }).success
    ).toBe(false)
    expect(storeSchema.safeParse({ ...base, slug: 'TOKO' }).success).toBe(
      false
    )
  })

  it('rejects an invalid email', () => {
    expect(
      storeSchema.safeParse({ ...base, contactEmail: 'bukan-email' }).success
    ).toBe(false)
  })

  it('rejects missing required province and city', () => {
    expect(storeSchema.safeParse({ ...base, province: '' }).success).toBe(
      false
    )
    expect(storeSchema.safeParse({ ...base, city: 'A' }).success).toBe(false)
  })

  it('trims surrounding whitespace', () => {
    const result = storeSchema.safeParse({ ...base, name: '  Toko Saya  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Toko Saya')
    }
  })

  it('accepts a valid absolute URL for logoUrl', () => {
    expect(
      storeSchema.safeParse({
        ...base,
        logoUrl: 'https://example.com/logo.png',
      }).success
    ).toBe(true)
  })

  it('rejects a malformed URL for bannerUrl', () => {
    expect(
      storeSchema.safeParse({ ...base, bannerUrl: 'not-a-url' }).success
    ).toBe(false)
  })
})
