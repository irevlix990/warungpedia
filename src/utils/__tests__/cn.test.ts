import { describe, expect, it } from 'vitest'
import { cn, formatIDR } from '@/utils/cn'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('resolves conflicting Tailwind classes deterministically', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('filters falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })
})

describe('formatIDR', () => {
  it('formats a plain integer as Indonesian rupiah', () => {
    expect(formatIDR(100000)).toBe('Rp100.000')
  })

  it('formats zero', () => {
    expect(formatIDR(0)).toBe('Rp0')
  })

  it('formats a large amount with grouping', () => {
    expect(formatIDR(1500000)).toBe('Rp1.500.000')
  })

  it('handles negative values', () => {
    expect(formatIDR(-25000)).toBe('-Rp25.000')
  })
})
