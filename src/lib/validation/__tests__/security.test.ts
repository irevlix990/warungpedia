/**
 * Security validation tests — Phase 15
 *
 * Ensures input validation schemas reject malicious or boundary inputs
 * that could lead to injection, IDOR, privilege escalation, or data
 * corruption if trusted blindly.
 */
import { describe, it, expect } from 'vitest'
import { productSchema } from '@/lib/validation/product'
import { payOrderSchema, requestWithdrawalSchema } from '@/lib/validation/payment'
import { addToCartSchema, updateCartItemSchema } from '@/lib/validation/cart'
import {
  setUserRoleSchema,
  moderateProductSchema,
  categorySchema,
} from '@/lib/validation/admin'
import { storeSchema } from '@/lib/validation/store'
import {
  shipOrderSchema,
  requestReturnSchema,
  escalateDisputeSchema,
} from '@/lib/validation/shipping'
import { reviewSchema } from '@/lib/validation/social'

const VALID_UUID = '00000000-0000-4000-8000-000000000001'

// ---- UUID injection tests ----
describe('UUID field injection protection', () => {
  it('rejects SQL injection in UUID fields', () => {
    const sqlInjection = "'; DROP TABLE orders;--"
    expect(addToCartSchema.safeParse({ productId: sqlInjection, quantity: 1 }).success).toBe(false)
    expect(payOrderSchema.safeParse({ orderId: sqlInjection, method: 'WALLET' }).success).toBe(false)
    expect(shipOrderSchema.safeParse({ orderId: sqlInjection, carrier: 'JNE', trackingNumber: 'ABC123' }).success).toBe(false)
    expect(requestReturnSchema.safeParse({ orderId: sqlInjection, orderItemId: VALID_UUID }).success).toBe(false)
  })

  it('rejects XSS payloads in UUID fields', () => {
    const xss = '<script>alert(1)</script>'
    expect(setUserRoleSchema.safeParse({ userId: xss, role: 'BUYER' }).success).toBe(false)
    expect(moderateProductSchema.safeParse({ productId: xss }).success).toBe(false)
  })

  it('rejects empty string as UUID', () => {
    expect(addToCartSchema.safeParse({ productId: '', quantity: 1 }).success).toBe(false)
    expect(payOrderSchema.safeParse({ orderId: '', method: 'WALLET' }).success).toBe(false)
  })
})

// ---- Privilege escalation prevention ----
describe('Role assignment validation', () => {
  it('accepts only the 4 valid roles', () => {
    for (const role of ['BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN']) {
      expect(setUserRoleSchema.safeParse({ userId: VALID_UUID, role }).success).toBe(true)
    }
  })

  it('rejects invalid role strings (privilege escalation attempts)', () => {
    const malicious = ['SUPERADMIN', 'admin', 'ROOT', 'GOD', 'HACKER', '']
    for (const role of malicious) {
      expect(setUserRoleSchema.safeParse({ userId: VALID_UUID, role }).success).toBe(false)
    }
  })
})

// ---- Money field security ----
describe('Financial input tampering prevention', () => {
  it('rejects floating point amounts in withdrawal requests', () => {
    expect(
      requestWithdrawalSchema.safeParse({
        amount: 99_999.99,
        bankName: 'BCA',
        bankAccountNumber: '1234',
        bankAccountName: 'Budi',
      }).success
    ).toBe(false)
  })

  it('rejects negative amounts', () => {
    expect(
      requestWithdrawalSchema.safeParse({
        amount: -100_000,
        bankName: 'BCA',
        bankAccountNumber: '1234',
        bankAccountName: 'Budi',
      }).success
    ).toBe(false)
  })

  it('rejects zero amount', () => {
    expect(
      requestWithdrawalSchema.safeParse({
        amount: 0,
        bankName: 'BCA',
        bankAccountNumber: '1234',
        bankAccountName: 'Budi',
      }).success
    ).toBe(false)
  })

  it('rejects negative product prices', () => {
    const baseProduct = {
      name: 'Produk',
      slug: 'produk',
      condition: 'new' as const,
      price: -1,
      stock: 10,
      status: 'DRAFT' as const,
    }
    expect(productSchema.safeParse(baseProduct).success).toBe(false)
  })

  it('rejects float product prices', () => {
    const baseProduct = {
      name: 'Produk',
      slug: 'produk',
      condition: 'new' as const,
      price: 10000.5,
      stock: 10,
      status: 'DRAFT' as const,
    }
    expect(productSchema.safeParse(baseProduct).success).toBe(false)
  })
})

// ---- Cart quantity manipulation ----
describe('Cart quantity boundary enforcement', () => {
  it('rejects quantity 0 (no free items)', () => {
    expect(addToCartSchema.safeParse({ productId: VALID_UUID, quantity: 0 }).success).toBe(false)
  })

  it('rejects negative quantities', () => {
    expect(addToCartSchema.safeParse({ productId: VALID_UUID, quantity: -5 }).success).toBe(false)
  })

  it('rejects excessive quantities (max 99)', () => {
    expect(addToCartSchema.safeParse({ productId: VALID_UUID, quantity: 100 }).success).toBe(false)
  })

  it('accepts boundary quantities (1 and 99)', () => {
    expect(addToCartSchema.safeParse({ productId: VALID_UUID, quantity: 1 }).success).toBe(true)
    expect(addToCartSchema.safeParse({ productId: VALID_UUID, quantity: 99 }).success).toBe(true)
  })

  it('rejects float quantities', () => {
    expect(addToCartSchema.safeParse({ productId: VALID_UUID, quantity: 1.5 }).success).toBe(false)
  })

  it('update cart item also enforces boundaries', () => {
    expect(updateCartItemSchema.safeParse({ itemId: VALID_UUID, quantity: 0 }).success).toBe(false)
    expect(updateCartItemSchema.safeParse({ itemId: VALID_UUID, quantity: 100 }).success).toBe(false)
  })
})

// ---- Text field injection ----
describe('Text field length & XSS protection', () => {
  it('store name rejects excessively long strings', () => {
    const long = 'A'.repeat(61)
    const result = storeSchema.safeParse({
      name: long,
      slug: 'test',
      tagline: '',
      description: '',
      contactEmail: 'a@b.com',
      phone: '081',
      province: 'DKI',
      city: 'Jakarta',
      logoUrl: '',
      bannerUrl: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameErrors = result.error.issues.filter((i) => i.path[0] === 'name')
      expect(nameErrors.length).toBeGreaterThan(0)
    }
  })

  it('product description rejects > 4000 chars', () => {
    const baseProduct = {
      name: 'Produk',
      slug: 'produk',
      condition: 'new' as const,
      price: 10000,
      stock: 10,
      status: 'DRAFT' as const,
      description: 'X'.repeat(4001),
    }
    expect(productSchema.safeParse(baseProduct).success).toBe(false)
  })

  it('category slug rejects uppercase and special chars', () => {
    expect(
      categorySchema.safeParse({ name: 'Test', slug: 'Test-123!' }).success
    ).toBe(false)
    expect(
      categorySchema.safeParse({ name: 'Test', slug: 'UPPER' }).success
    ).toBe(false)
  })
})

// ---- Review rating manipulation ----
describe('Review rating boundary enforcement', () => {
  it('rejects ratings below 1', () => {
    expect(
      reviewSchema.safeParse({
        orderId: VALID_UUID,
        productId: VALID_UUID,
        rating: 0,
        body: 'Ulasan.',
      }).success
    ).toBe(false)
  })

  it('rejects ratings above 5', () => {
    expect(
      reviewSchema.safeParse({
        orderId: VALID_UUID,
        productId: VALID_UUID,
        rating: 6,
        body: 'Ulasan.',
      }).success
    ).toBe(false)
  })

  it('rejects float ratings', () => {
    expect(
      reviewSchema.safeParse({
        orderId: VALID_UUID,
        productId: VALID_UUID,
        rating: 4.5,
        body: 'Ulasan.',
      }).success
    ).toBe(false)
  })

  it('accepts all valid ratings (1–5)', () => {
    for (let r = 1; r <= 5; r++) {
      expect(
        reviewSchema.safeParse({
          orderId: VALID_UUID,
          productId: VALID_UUID,
          rating: r,
          body: 'Ulasan.',
        }).success
      ).toBe(true)
    }
  })
})

// ---- Dispute escalation ----
describe('Dispute & return security', () => {
  it('escalation requires a non-empty reason', () => {
    expect(
      escalateDisputeSchema.safeParse({ returnId: VALID_UUID, reason: '' }).success
    ).toBe(false)
  })

  it('escalation rejects an oversized reason (DoS)', () => {
    expect(
      escalateDisputeSchema.safeParse({
        returnId: VALID_UUID,
        reason: 'X'.repeat(201),
      }).success
    ).toBe(false)
  })
})

// ---- Payment method manipulation ----
describe('Payment method enumeration enforcement', () => {
  it('rejects unknown payment methods', () => {
    expect(
      payOrderSchema.safeParse({ orderId: VALID_UUID, method: 'CRYPTO' }).success
    ).toBe(false)
    expect(
      payOrderSchema.safeParse({ orderId: VALID_UUID, method: '' }).success
    ).toBe(false)
  })

  it('accepts all valid payment methods', () => {
    for (const method of ['WALLET', 'BANK_TRANSFER', 'COD']) {
      expect(
        payOrderSchema.safeParse({ orderId: VALID_UUID, method }).success
      ).toBe(true)
    }
  })
})
