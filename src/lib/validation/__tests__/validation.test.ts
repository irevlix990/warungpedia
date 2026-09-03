import { describe, expect, it } from 'vitest'
import {
  addressSchema,
} from '@/lib/validation/address'
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updateProfileSchema,
} from '@/lib/validation/auth'

describe('auth validation', () => {
  describe('signUpSchema', () => {
    it('accepts a valid sign-up payload', () => {
      const result = signUpSchema.safeParse({
        fullName: 'Budi Santoso',
        email: 'Budi@Example.COM',
        password: 'rahasia123',
        confirmPassword: 'rahasia123',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('budi@example.com')
        expect(result.data.fullName).toBe('Budi Santoso')
      }
    })

    it('rejects a short name', () => {
      const result = signUpSchema.safeParse({
        fullName: 'A',
        email: 'budi@example.com',
        password: 'rahasia123',
        confirmPassword: 'rahasia123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path[0] === 'fullName')).toBe(
          true
        )
      }
    })

    it('rejects an invalid email', () => {
      const result = signUpSchema.safeParse({
        fullName: 'Budi Santoso',
        email: 'not-an-email',
        password: 'rahasia123',
        confirmPassword: 'rahasia123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects a weak password without numbers', () => {
      const result = signUpSchema.safeParse({
        fullName: 'Budi Santoso',
        email: 'budi@example.com',
        password: 'abcdefgh',
        confirmPassword: 'abcdefgh',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path[0] === 'password')).toBe(
          true
        )
      }
    })

    it('rejects a mismatched confirmation password', () => {
      const result = signUpSchema.safeParse({
        fullName: 'Budi Santoso',
        email: 'budi@example.com',
        password: 'rahasia123',
        confirmPassword: 'rahasia124',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path[0] === 'confirmPassword')
        ).toBe(true)
      }
    })
  })

  describe('signInSchema', () => {
    it('accepts valid credentials', () => {
      expect(
        signInSchema.safeParse({
          email: 'budi@example.com',
          password: 'rahasia123',
        }).success
      ).toBe(true)
    })

    it('rejects an empty password', () => {
      expect(
        signInSchema.safeParse({
          email: 'budi@example.com',
          password: '',
        }).success
      ).toBe(false)
    })
  })

  describe('forgotPasswordSchema', () => {
    it('accepts a valid email', () => {
      expect(
        forgotPasswordSchema.safeParse({ email: 'budi@example.com' }).success
      ).toBe(true)
    })

    it('rejects an invalid email', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'budi' }).success).toBe(
        false
      )
    })
  })

  describe('resetPasswordSchema', () => {
    it('requires matching strong passwords', () => {
      const ok = resetPasswordSchema.safeParse({
        password: 'rahasia123',
        confirmPassword: 'rahasia123',
      })
      expect(ok.success).toBe(true)

      const bad = resetPasswordSchema.safeParse({
        password: 'rahasia123',
        confirmPassword: 'rahasia124',
      })
      expect(bad.success).toBe(false)
    })
  })

  describe('updateProfileSchema', () => {
    it('accepts a valid profile update', () => {
      const result = updateProfileSchema.safeParse({
        fullName: 'Budi Santoso',
        phone: '08123456789',
        preferredLocale: 'id',
      })
      expect(result.success).toBe(true)
    })

    it('allows nullable phone', () => {
      const result = updateProfileSchema.safeParse({
        fullName: 'Budi Santoso',
        phone: null,
        preferredLocale: 'en',
      })
      expect(result.success).toBe(true)
    })
  })
})

describe('address validation', () => {
  it('accepts a valid Indonesian address', () => {
    const result = addressSchema.safeParse({
      label: 'Rumah',
      recipientName: 'Budi Santoso',
      phone: '08123456789',
      street: 'Jl. Merdeka No. 10',
      district: 'Coblong',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40132',
      country: 'Indonesia',
      isDefault: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a 4-digit postal code', () => {
    const result = addressSchema.safeParse({
      recipientName: 'Budi Santoso',
      phone: '08123456789',
      street: 'Jl. Merdeka No. 10',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '4013',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'postalCode')).toBe(
        true
      )
    }
  })

  it('rejects a missing city', () => {
    const result = addressSchema.safeParse({
      recipientName: 'Budi Santoso',
      phone: '08123456789',
      street: 'Jl. Merdeka No. 10',
      province: 'Jawa Barat',
    })
    expect(result.success).toBe(false)
  })
})