import { describe, it, expect } from 'vitest'
import {
  ANALYTICS_RANGE_DAYS,
  resolveAnalyticsRange,
  dayKey,
  seriesOfDays,
  completeDailySeries,
} from '../analytics'

const now = new Date(2026, 0, 15, 12, 0, 0)

function calendarDaysBetween(from: Date, to: Date): number {
  return Math.round(
    (Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
      Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) /
      86400000
  )
}

describe('ANALYTICS_RANGE_DAYS', () => {
  it('maps every preset to a positive day count', () => {
    expect(ANALYTICS_RANGE_DAYS['7d']).toBe(7)
    expect(ANALYTICS_RANGE_DAYS['30d']).toBe(30)
    expect(ANALYTICS_RANGE_DAYS['90d']).toBe(90)
  })
})

describe('resolveAnalyticsRange', () => {
  it('returns a start-of-day window `days` back from now', () => {
    const { from, to } = resolveAnalyticsRange('7d', now)
    expect(from.getFullYear()).toBe(2026)
    expect(from.getMonth()).toBe(0)
    expect(from.getDate()).toBe(8)
    expect(from.getHours()).toBe(0)
    expect(to.getHours()).toBe(12)
  })

  it('handles 30d and 90d windows', () => {
    expect(calendarDaysBetween(resolveAnalyticsRange('30d', now).from, now)).toBe(30)
    expect(calendarDaysBetween(resolveAnalyticsRange('90d', now).from, now)).toBe(90)
  })

  it('defaults an unknown range to 30 days', () => {
    const r = resolveAnalyticsRange('bogus' as never, now)
    expect(calendarDaysBetween(r.from, now)).toBe(30)
  })
})

describe('dayKey', () => {
  it('zero-pads month and day', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(dayKey(new Date(2026, 10, 25))).toBe('2026-11-25')
  })
})

describe('seriesOfDays', () => {
  it('returns an inclusive ascending day range', () => {
    expect(seriesOfDays(new Date(2026, 0, 8), new Date(2026, 0, 10))).toEqual([
      '2026-01-08',
      '2026-01-09',
      '2026-01-10',
    ])
  })

  it('returns a single day for equal bounds', () => {
    expect(seriesOfDays(new Date(2026, 0, 8), new Date(2026, 0, 8))).toEqual([
      '2026-01-08',
    ])
  })
})

describe('completeDailySeries', () => {
  interface Point {
    date: string
    gmv: number
    orders: number
  }

  it('zero-fills missing days and keeps partial values', () => {
    const partial: Point[] = [
      { date: '2026-01-08', gmv: 100, orders: 2 },
      { date: '2026-01-10', gmv: 50, orders: 1 },
    ]
    const out = completeDailySeries(
      partial,
      new Date(2026, 0, 8),
      new Date(2026, 0, 11),
      () => ({ gmv: 0, orders: 0 })
    )
    expect(out).toEqual([
      { date: '2026-01-08', gmv: 100, orders: 2 },
      { date: '2026-01-09', gmv: 0, orders: 0 },
      { date: '2026-01-10', gmv: 50, orders: 1 },
      { date: '2026-01-11', gmv: 0, orders: 0 },
    ])
  })

  it('returns an empty series when bounds are invalid', () => {
    const out = completeDailySeries(
      [] as Point[],
      new Date(2026, 0, 11),
      new Date(2026, 0, 8),
      () => ({ gmv: 0, orders: 0 })
    )
    expect(out).toEqual([])
  })
})
