import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind utility classes, resolving conflicts deterministically.
 * Wraps clsx + tailwind-merge for use across the design system.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formats an integer IDR amount as a readable Indonesian rupiah string. */
export function formatIDR(amount: number): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
  const sign = amount < 0 ? '-' : ''
  return `${sign}Rp${formatted}`
}
