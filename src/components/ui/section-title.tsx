import { cn } from '@/utils/cn'

interface SectionTitleProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

/** Consistent section heading used across landing page sections. */
export function SectionTitle({
  title,
  subtitle,
  action,
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  )
}