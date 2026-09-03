import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PRODUCT_SORT,
  paginationOffset,
  parsePage,
  parseProductSort,
  PRODUCT_SORTS,
  totalPages,
} from '@/utils/search'

describe('parseProductSort', () => {
  it('parses valid sort keys', () => {
    expect(parseProductSort('price-asc')).toBe('price-asc')
    expect(parseProductSort('price-desc')).toBe('price-desc')
    expect(parseProductSort('newest')).toBe('newest')
    expect(parseProductSort('relevancy')).toBe('relevancy')
  })

  it('falls back to default for unknown or empty input', () => {
    expect(parseProductSort('bogus')).toBe(DEFAULT_PRODUCT_SORT)
    expect(parseProductSort(undefined)).toBe(DEFAULT_PRODUCT_SORT)
    expect(parseProductSort('')).toBe(DEFAULT_PRODUCT_SORT)
  })

  it('exposes a fixed set of valid sorts', () => {
    expect(PRODUCT_SORTS).toEqual([
      'relevancy',
      'newest',
      'price-asc',
      'price-desc',
    ])
  })
})

describe('parsePage', () => {
  it('parses valid positive pages', () => {
    expect(parsePage('1')).toBe(1)
    expect(parsePage('5')).toBe(5)
  })

  it('falls back to 1 for invalid input', () => {
    expect(parsePage('0')).toBe(1)
    expect(parsePage('-2')).toBe(1)
    expect(parsePage('abc')).toBe(1)
    expect(parsePage('1.5')).toBe(1)
    expect(parsePage(undefined)).toBe(1)
  })
})

describe('paginationOffset', () => {
  it('computes zero-based offset', () => {
    expect(paginationOffset(1, 24)).toBe(0)
    expect(paginationOffset(2, 24)).toBe(24)
    expect(paginationOffset(3, 24)).toBe(48)
  })

  it('clamps invalid pages to a safe offset', () => {
    expect(paginationOffset(0, 24)).toBe(0)
    expect(paginationOffset(-5, 24)).toBe(0)
    expect(paginationOffset(2.9, 24)).toBe(24)
  })
})

describe('totalPages', () => {
  it('computes total pages with a ceiling', () => {
    expect(totalPages(0, 24)).toBe(1)
    expect(totalPages(24, 24)).toBe(1)
    expect(totalPages(25, 24)).toBe(2)
    expect(totalPages(100, 24)).toBe(5)
  })

  it('returns 0 for a non-positive page size', () => {
    expect(totalPages(10, 0)).toBe(0)
    expect(totalPages(10, -1)).toBe(0)
  })
})
