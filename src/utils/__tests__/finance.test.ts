import { describe, it, expect } from 'vitest'
import {
  splitEarning,
  earningBreakdown,
  returnWindowEnds,
  canRequestReturn,
} from '../finance'

describe('splitEarning', () => {
  it('splits gross into commission and net', () => {
    const { commission, net } = splitEarning(100_000, 500)
    expect(commission).toBe(5_000)
    expect(net).toBe(95_000)
  })

  it('caps commission at the gross', () => {
    const { commission, net } = splitEarning(1_000, 500_00)
    expect(commission).toBe(1_000)
    expect(net).toBe(0)
  })

  it('treats zero/negative rate as zero commission', () => {
    expect(splitEarning(100_000, 0).commission).toBe(0)
    expect(splitEarning(100_000, -1).commission).toBe(0)
  })
})

describe('earningBreakdown', () => {
  it('produces integer labels', () => {
    const b = earningBreakdown(100_000, 500)
    expect(b.commission).toBe(5_000)
    expect(b.net).toBe(95_000)
    expect(b.commissionLabel).toMatch(/5\.000/)
    expect(b.netLabel).toMatch(/95\.000/)
  })
})

describe('returnWindowEnds', () => {
  const completed = new Date('2026-01-01T00:00:00Z')

  it('adds the window days to the completion date', () => {
    const ends = returnWindowEnds(completed.toISOString(), 30)
    expect(new Date(ends as string).toISOString()).toBe(
      new Date('2026-01-31T00:00:00Z').toISOString()
    )
  })

  it('returns null when completed date is missing', () => {
    expect(returnWindowEnds(null, 30)).toBe(null)
    expect(returnWindowEnds(undefined, 30)).toBe(null)
  })

  it('returns null for a non-positive window (no expiry)', () => {
    expect(returnWindowEnds(completed.toISOString(), 0)).toBe(null)
    expect(returnWindowEnds(completed.toISOString(), -1)).toBe(null)
  })
})

describe('canRequestReturn', () => {
  const completed = new Date('2026-01-01T00:00:00Z').toISOString()

  it('allows a return inside the window', () => {
    expect(
      canRequestReturn(completed, 30, new Date('2026-01-15T00:00:00Z'))
    ).toBe(true)
  })

  it('blocks a return after the window closes', () => {
    expect(
      canRequestReturn(completed, 30, new Date('2026-02-15T00:00:00Z'))
    ).toBe(false)
  })

  it('allows returns at the exact closing instant', () => {
    expect(
      canRequestReturn(completed, 30, new Date('2026-01-31T00:00:00Z'))
    ).toBe(true)
  })

  it('allows returns forever when the window is non-positive', () => {
    expect(
      canRequestReturn(completed, 0, new Date('2030-01-01T00:00:00Z'))
    ).toBe(true)
  })

  it('blocks when the completed date is missing', () => {
    expect(canRequestReturn(null, 30)).toBe(false)
  })
})