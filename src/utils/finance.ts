import { formatIDR } from './cn'
import type { EarningBreakdown } from '@/types/payment'

/** Default marketplace commission rate in basis points (500 = 5%). */
export const DEFAULT_COMMISSION_BPS = 500

/**
 * Computes the marketplace commission (floor in integer IDR) for a gross
 * amount at a rate in basis points, plus the seller's net. The commission
 * never exceeds the gross.
 */
export function splitEarning(
  gross: number,
  rateBps: number
): { commission: number; net: number } {
  const safeRate = Number.isFinite(rateBps) && rateBps > 0 ? rateBps : 0
  const commission = Math.floor((gross * safeRate) / 10000)
  const capped = Math.min(commission, gross)
  return { commission: capped, net: gross - capped }
}

/** Derives display labels for a gross figure at a commission rate. */
export function earningBreakdown(
  gross: number,
  rateBps: number
): EarningBreakdown {
  const { commission, net } = splitEarning(gross, rateBps)
  return {
    gross,
    commission,
    net,
    commissionLabel: formatIDR(commission),
    netLabel: formatIDR(net),
  }
}

/** Default buyer return window in days. */
export const DEFAULT_RETURN_WINDOW_DAYS = 30

/**
 * Returns the ISO timestamp when the return window closes, given an order
 * completion timestamp and a window in days. A non-positive window means no
 * window (returns never expire). Pure and unit-testable.
 */
export function returnWindowEnds(
  completedAt: string | null | undefined,
  windowDays: number
): string | null {
  if (!completedAt) return null
  const days = Number.isFinite(windowDays) ? Math.floor(windowDays) : 0
  if (days <= 0) return null
  return new Date(
    new Date(completedAt).getTime() + days * 24 * 60 * 60 * 1000
  ).toISOString()
}

/**
 * Whether a return is still within its window at a given "now" timestamp.
 * Uses the closed date when provided, else the current time.
 */
export function canRequestReturn(
  completedAt: string | null | undefined,
  windowDays: number,
  now?: Date
): boolean {
  if (!completedAt) return false
  const closes = returnWindowEnds(completedAt, windowDays)
  if (!closes) return true
  return new Date(now ?? new Date()).getTime() <= new Date(closes).getTime()
}
