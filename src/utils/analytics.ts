import type { AnalyticsRange } from '@/types/analytics'

/** Day count for each analytics range preset. */
export const ANALYTICS_RANGE_DAYS: Record<AnalyticsRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

/** Valid analytics range presets. */
export const ANALYTICS_RANGES: readonly AnalyticsRange[] = [
  '7d',
  '30d',
  '90d',
]

/**
 * Resolves a range preset to an inclusive `{ from, to }` window. `from` is
 * the start-of-day `days` back from `now`; `to` is `now`. Pure and testable.
 */
export function resolveAnalyticsRange(
  range: AnalyticsRange,
  now: Date = new Date()
): { from: Date; to: Date } {
  const days = ANALYTICS_RANGE_DAYS[range] ?? 30
  const to = new Date(now)
  const from = new Date(now)
  from.setDate(from.getDate() - days)
  from.setHours(0, 0, 0, 0)
  return { from, to }
}

/** Local `YYYY-MM-DD` key for a date, used to bucket daily series. */
export function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Ascending list of day keys (inclusive) between two dates. */
export function seriesOfDays(from: Date, to: Date): string[] {
  const out: string[] = []
  const cursor = new Date(from)
  while (cursor <= to) {
    out.push(dayKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

/**
 * Zero-fills a partial set of daily points into a complete ascending series
 * over `[from, to]`, applying `template` to any missing day. Useful for
 * turning a sparse aggregate into a chart-ready line.
 */
export function completeDailySeries<P extends { date: string }>(
  partial: P[],
  from: Date,
  to: Date,
  template: () => Omit<P, 'date'>
): P[] {
  const map = new Map(partial.map((p) => [p.date, p]))
  return seriesOfDays(from, to).map((date) => ({
    ...template(),
    date,
    ...(map.get(date) ?? {}),
  })) as P[]
}
