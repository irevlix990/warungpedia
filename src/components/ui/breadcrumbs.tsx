import Link from 'next/link'
import { cn } from '@/utils/cn'

export interface Crumb {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: Crumb[]
  className?: string
}

/** Lightweight navigation trail (last item is the current page). */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex flex-wrap items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400',
        className
      )}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-brand-600 dark:hover:text-brand-300"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? 'page' : undefined}
                className={cn(
                  isLast && 'font-semibold text-neutral-800 dark:text-neutral-100'
                )}
              >
                {item.label}
              </span>
            )}
            {!isLast ? (
              <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-600">
                /
              </span>
            ) : null}
          </span>
        )
      })}
    </nav>
  )
}