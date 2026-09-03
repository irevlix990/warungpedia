export interface RankItem {
  id: string
  name: string
  value: string
  /** Numeric weight used to size the background bar. */
  accent?: number
}

/**
 * A presentational ranked list for "top N" analytics (sellers, products,
 * categories). `accent` renders as a proportional bar behind the row.
 */
export function RankList({
  items,
  maxValue,
}: {
  items: RankItem[]
  maxValue: number
}) {
  if (items.length === 0) {
    return <p className="py-4 text-sm text-neutral-500">Belum ada data.</p>
  }
  return (
    <ol className="divide-y divide-neutral-100 dark:divide-neutral-800">
      {items.map((item, idx) => {
        const pct = maxValue > 0 ? (Number(item.accent ?? 0) / maxValue) * 100 : 0
        return (
          <li key={item.id} className="relative py-3">
            {item.accent !== undefined && (
              <div
                className="absolute inset-y-0 left-0 rounded-r bg-brand-500/10 dark:bg-brand-500/15"
                style={{ width: `${pct}%` }}
              />
            )}
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-5 shrink-0 text-sm font-bold text-neutral-400">
                  {idx + 1}
                </span>
                <span className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
                  {item.name}
                </span>
              </div>
              <span className="shrink-0 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                {item.value}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
