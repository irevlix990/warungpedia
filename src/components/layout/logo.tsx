import Link from 'next/link'
import Image from 'next/image'
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
        'flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2',
        className
      )}
      aria-label="Warungpedia"
    >
      <Image
        src="/logo_warungpedia.jpg"
        alt="Warungpedia"
        width={40}
        height={40}
        className="h-10 w-10 rounded-xl object-cover shadow-soft"
        priority
      />
      <span className="font-display text-lg font-extrabold tracking-tight text-brand-700 dark:text-brand-300">
        Warung<span className="text-brand-500">pedia</span>
      </span>
    </Link>
  )
}