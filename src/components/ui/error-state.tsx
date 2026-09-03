import { cn } from '@/utils/cn'

interface ErrorStateProps {
  title?: string
  description?: string
  retry?: () => void
  className?: string
}

/** Consistent user-friendly error state. Does not expose technical details. */
export function ErrorState({
  title = 'Terjadi kendala',
  description = 'Maaf, terjadi masalah saat memuat data. Silakan coba lagi sebentar lagi.',
  retry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-danger-300 bg-danger-50 px-6 py-12 text-center dark:border-danger-700 dark:bg-danger-600/10',
        className
      )}
    >
      <div className="space-y-1">
        <h3 className="font-display text-base font-bold text-danger-700 dark:text-danger-500">
          {title}
        </h3>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
            {description}
          </p>
        ) : null}
      </div>
      {retry ? (
        <button
          type="button"
          onClick={retry}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-danger-300 px-4 text-sm font-semibold text-danger-700 transition-colors hover:bg-danger-100 dark:border-danger-700 dark:text-danger-500 dark:hover:bg-danger-600/20"
        >
          Coba lagi
        </button>
      ) : null}
    </div>
  )
}
