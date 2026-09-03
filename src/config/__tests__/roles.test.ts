import { describe, expect, it } from 'vitest'
import {
  hasPermission,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLES,
} from '@/config/roles'
import { DEFAULT_LOCALE, isLocale, LOCALES } from '@/config/i18n'
import { getDictionary } from '@/lib/i18n'

describe('roles', () => {
  it('defines the four required roles', () => {
    expect(ROLES).toMatchObject({
      BUYER: 'BUYER',
      SELLER: 'SELLER',
      ADMIN: 'ADMIN',
      SUPER_ADMIN: 'SUPER_ADMIN',
    })
  })

  it('grants buyers no implicit permissions and sellers only store management', () => {
    expect(ROLE_PERMISSIONS.BUYER).toHaveLength(0)
    expect(ROLE_PERMISSIONS.SELLER).toEqual([PERMISSIONS.MANAGE_STORE])
  })

  it('grants admins a constrained, non-empty permission set', () => {
    expect(ROLE_PERMISSIONS.ADMIN.length).toBeGreaterThan(0)
    expect(ROLE_PERMISSIONS.ADMIN).toContain(PERMISSIONS.MANAGE_ORDERS)
  })

  it('grants super admins at least all admin permissions', () => {
    for (const permission of ROLE_PERMISSIONS.ADMIN) {
      expect(ROLE_PERMISSIONS.SUPER_ADMIN).toContain(permission)
    }
  })

  it('resolves permissions through hasPermission', () => {
    expect(
      hasPermission(ROLES.ADMIN, PERMISSIONS.MANAGE_ORDERS)
    ).toBe(true)
    expect(
      hasPermission(ROLES.BUYER, PERMISSIONS.MANAGE_ORDERS)
    ).toBe(false)
    expect(
      hasPermission(ROLES.SELLER, PERMISSIONS.MODERATE_PRODUCTS)
    ).toBe(false)
  })
})

describe('i18n', () => {
  it('defaults to Bahasa Indonesia', () => {
    expect(DEFAULT_LOCALE).toBe('id')
    expect(LOCALES).toContain('id')
    expect(LOCALES).toContain('en')
  })

  it('validates locale codes', () => {
    expect(isLocale('id')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('fr')).toBe(false)
  })

  it('returns a dictionary for supported locales with matching keys', () => {
    const idDict = getDictionary('id')
    const enDict = getDictionary('en')
    expect(idDict.nav.home).toBe('Beranda')
    expect(enDict.nav.home).toBe('Home')
    expect(Object.keys(idDict)).toEqual(Object.keys(enDict))
  })
})
