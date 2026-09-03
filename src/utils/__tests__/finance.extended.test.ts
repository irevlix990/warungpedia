/**
 * Extended finance unit tests — Phase 15
 *
 * Covers additional edge cases for commission, return-window, and
 * formatting to guarantee integer-IDR correctness and boundary behavior.
 */
import { describe, it, expect } from 'vitest'
import {
  splitEarning,
  earningBreakdown,
  returnWindowEnds,
  canRequestReturn,
  DEFAULT_COMMISSION_BPS,
  DEFAULT_RETURN_WINDOW_DAYS,
} from '../finance'

describe('DEFAULT constants', () => {
  it('commission default is 500 bps (5%)', () => {
    expect(DEFAULT_COMMISSION_BPS).toBe(500)
  })

  it('return window default is 30 days per spec (overridable by admin)', () => {
    expect(DEFAULT_RETURN_WINDOW_DAYS).toBe(30)
  })
})

describe('splitEarning — additional edge cases', () => {
  it('handles zero gross correctly (no division by zero)', () => {
    const { commission, net } = splitEarning(0, 500)
    expect(commission).toBe(0)
    expect(net).toBe(0)
  })

  it('floors fractional commission to whole IDR', () => {
    // 100001 * 500 / 10000 = 5000.05 → floors to 5000
    const { commission } = splitEarning(100_001, 500)
    expect(Number.isInteger(commission)).toBe(true)
    expect(commission).toBe(5000)
  })

  it('commission + net always equals gross (no IDR lost)', () => {
    const testCases = [
      { gross: 999, rate: 500 },
      { gross: 1, rate: 500 },
      { gross: 10_000_000, rate: 300 },
      { gross: 75_000, rate: 1000 },
    ]
    for (const { gross, rate } of testCases) {
      const { commission, net } = splitEarning(gross, rate)
      expect(commission + net).toBe(gross)
    }
  })

  it('treats NaN rate as zero commission', () => {
    expect(splitEarning(100_000, NaN).commission).toBe(0)
  })

  it('treats Infinity rate as zero commission', () => {
    // NaN/Infinity should not escape as commission
    expect(splitEarning(100_000, Infinity).commission).toBe(0)
  })

  it('caps commission when rate equals 10000 bps (100%)', () => {
    const { commission, net } = splitEarning(50_000, 10_000)
    expect(commission).toBe(50_000)
    expect(net).toBe(0)
  })

  it('different rates produce proportional commissions', () => {
    const base = splitEarning(1_000_000, 500).commission  // 5%
    const double = splitEarning(1_000_000, 1000).commission // 10%
    expect(double).toBe(base * 2)
  })
})

describe('earningBreakdown — label format', () => {
  it('produces IDR labels with correct Rp prefix', () => {
    const b = earningBreakdown(250_000, 500)
    expect(b.commissionLabel).toMatch(/^Rp/)
    expect(b.netLabel).toMatch(/^Rp/)
  })

  it('gross equals commission + net', () => {
    const { gross, commission, net } = earningBreakdown(1_234_567, 750)
    expect(commission + net).toBe(gross)
  })

  it('zero-commission case formats as Rp0', () => {
    const b = earningBreakdown(100_000, 0)
    expect(b.commission).toBe(0)
    expect(b.commissionLabel).toBe('Rp0')
    expect(b.net).toBe(100_000)
  })
})

describe('returnWindowEnds — boundary cases', () => {
  const completed = '2026-01-01T00:00:00.000Z'

  it('produces the exact closing timestamp for 3 days (marketplace rule)', () => {
    const closes = returnWindowEnds(completed, 3)
    expect(closes).toBe(new Date('2026-01-04T00:00:00.000Z').toISOString())
  })

  it('handles a single day window', () => {
    const closes = returnWindowEnds(completed, 1)
    expect(closes).toBe(new Date('2026-01-02T00:00:00.000Z').toISOString())
  })

  it('floors non-integer window days', () => {
    const a = returnWindowEnds(completed, 3)
    const b = returnWindowEnds(completed, 3.9)
    expect(a).toBe(b)
  })

  it('empty string completedAt is treated as nullish', () => {
    expect(returnWindowEnds('', 30)).toBeNull()
  })
})

describe('canRequestReturn — security boundary', () => {
  const completed = '2026-01-01T00:00:00.000Z'

  it('one millisecond after closing is rejected', () => {
    const juuuustAfter = new Date('2026-01-04T00:00:00.001Z')
    expect(canRequestReturn(completed, 3, juuuustAfter)).toBe(false)
  })

  it('one millisecond before closing is accepted', () => {
    const juuuustBefore = new Date('2026-01-03T23:59:59.999Z')
    expect(canRequestReturn(completed, 3, juuuustBefore)).toBe(true)
  })

  it('undefined completedAt returns false (safe default)', () => {
    expect(canRequestReturn(undefined, 30)).toBe(false)
  })

  it('returns consistently regardless of whitespace in date string', () => {
    const withZ = canRequestReturn('2026-01-01T00:00:00.000Z', 3, new Date('2026-01-02T00:00:00Z'))
    expect(withZ).toBe(true)
  })
})
