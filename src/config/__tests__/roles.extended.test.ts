/**
 * RBAC & Authorization unit tests — Phase 15
 *
 * Exhaustively tests the permission model, ensuring the principle of least
 * privilege is strictly enforced across all four roles.
 */
import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLES,
  type Permission,
  type Role,
} from '@/config/roles'

const ALL_ROLES = [
  ROLES.BUYER,
  ROLES.SELLER,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
] as const

const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[]

describe('RBAC Role Definitions', () => {
  it('exactly 4 roles exist in the system', () => {
    expect(Object.keys(ROLES)).toHaveLength(4)
  })

  it('exactly 15 granular permissions exist', () => {
    expect(ALL_PERMISSIONS).toHaveLength(15)
  })
})

describe('Principle of Least Privilege — BUYER', () => {
  it('BUYER has zero administrative permissions', () => {
    expect(ROLE_PERMISSIONS.BUYER).toEqual([])
  })

  it('BUYER cannot perform any admin action', () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(hasPermission(ROLES.BUYER, permission)).toBe(false)
    }
  })
})

describe('Principle of Least Privilege — SELLER', () => {
  it('SELLER only has MANAGE_STORE permission', () => {
    expect(ROLE_PERMISSIONS.SELLER).toEqual([PERMISSIONS.MANAGE_STORE])
  })

  it('SELLER cannot moderate products', () => {
    expect(hasPermission(ROLES.SELLER, PERMISSIONS.MODERATE_PRODUCTS)).toBe(false)
  })

  it('SELLER cannot manage users or verify other sellers', () => {
    expect(hasPermission(ROLES.SELLER, PERMISSIONS.MANAGE_USERS)).toBe(false)
    expect(hasPermission(ROLES.SELLER, PERMISSIONS.VERIFY_SELLERS)).toBe(false)
  })

  it('SELLER cannot approve withdrawals (prevents self-approval)', () => {
    expect(hasPermission(ROLES.SELLER, PERMISSIONS.MANAGE_WITHDRAWALS)).toBe(false)
  })

  it('SELLER cannot manage platform vouchers or CMS', () => {
    expect(hasPermission(ROLES.SELLER, PERMISSIONS.MANAGE_VOUCHERS)).toBe(false)
    expect(hasPermission(ROLES.SELLER, PERMISSIONS.MANAGE_CMS)).toBe(false)
  })
})

describe('Admin Authorization — ADMIN & SUPER_ADMIN', () => {
  it('ADMIN has all standard operational permissions', () => {
    const requiredForAdmin: Permission[] = [
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.MANAGE_SELLERS,
      PERMISSIONS.VERIFY_SELLERS,
      PERMISSIONS.MODERATE_PRODUCTS,
      PERMISSIONS.MANAGE_ORDERS,
      PERMISSIONS.MANAGE_PAYMENTS,
      PERMISSIONS.MANAGE_WITHDRAWALS,
      PERMISSIONS.MANAGE_REFUNDS,
      PERMISSIONS.MANAGE_DISPUTES,
      PERMISSIONS.MANAGE_VOUCHERS,
      PERMISSIONS.MANAGE_FLASH_SALES,
      PERMISSIONS.MANAGE_CMS,
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.MANAGE_SETTINGS,
    ]

    for (const perm of requiredForAdmin) {
      expect(hasPermission(ROLES.ADMIN, perm)).toBe(true)
    }
  })

  it('SUPER_ADMIN holds every single permission in the system', () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(hasPermission(ROLES.SUPER_ADMIN, perm)).toBe(true)
    }
  })
})

describe('Permission Boundary Matrix', () => {
  it('no role receives undefined or null permissions', () => {
    for (const role of ALL_ROLES) {
      const perms = ROLE_PERMISSIONS[role]
      expect(Array.isArray(perms)).toBe(true)
      for (const p of perms) {
        expect(p).toBeDefined()
        expect(ALL_PERMISSIONS).toContain(p)
      }
    }
  })

  it('hasPermission returns false for unknown role string', () => {
    expect(hasPermission('HACKER' as Role, PERMISSIONS.MANAGE_USERS)).toBe(false)
  })

  it('hasPermission returns false for unknown permission string', () => {
    expect(hasPermission(ROLES.ADMIN, 'DELETE_DATABASE' as Permission)).toBe(false)
  })
})
