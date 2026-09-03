import Link from 'next/link'
import { cn } from '@/utils/cn'

interface LogoProps {
  className?: string
}

/** Brand mark + wordmark linking to the home page. */
export function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        'flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2',
        className
      )}
      aria-label="Warungpedia"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-brand-600 font-display text-lg font-extrabold text-white shadow-soft">
        W
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight text-brand-700 dark:text-brand-300">
        Warung<span className="text-brand-500">pedia</span>
      </span>
    </Link>
  )
}