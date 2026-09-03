import { cn } from '@/utils/cn'

export interface KpiCardProps {
  label: string
  value: string
  hint?: string
  className?: string
}

/** A compact label/value KPI stat card used across analytics dashboards. */
export function KpiCard({ label, value, hint, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-200 bg-white p-4 shadow-soft dark:border-neutral-800 dark:bg-neutral-900',
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}
