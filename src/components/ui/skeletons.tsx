import { cn } from '@/utils/cn'
import { Skeleton } from './skeleton'

// ─── ProductCard Skeleton ────────────────────────────────────────────────────

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900',
        className
      )}
    >
      {/* Image area */}
      <Skeleton className="aspect-square w-full rounded-none rounded-b-none" />

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        {/* Product name */}
        <Skeleton className="h-4 w-4/5 rounded-md" />
        <Skeleton className="h-4 w-3/5 rounded-md" />

        {/* Store name */}
        <Skeleton className="h-3 w-1/2 rounded-md" />

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-16 rounded-sm" />
          <Skeleton className="h-3 w-6 rounded-sm" />
        </div>

        {/* Price */}
        <Skeleton className="mt-1 h-5 w-24 rounded-md" />

        {/* Stock badge */}
        <Skeleton className="h-5 w-14 rounded-md" />
      </div>
    </div>
  )
}

// ─── CategoryCard Skeleton ───────────────────────────────────────────────────

export function CategoryCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900',
        className
      )}
    >
      <Skeleton className="size-12 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-1/3 rounded-md" />
      </div>
    </div>
  )
}

// ─── KPICard Skeleton ────────────────────────────────────────────────────────

export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900',
        className
      )}
    >
      <Skeleton className="h-3 w-20 rounded-sm" />
      <Skeleton className="mt-2.5 h-7 w-28 rounded-md" />
      <Skeleton className="mt-1.5 h-3 w-16 rounded-sm" />
    </div>
  )
}

// ─── List Row Skeleton ───────────────────────────────────────────────────────

export function ListRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900',
        className
      )}
    >
      <Skeleton className="size-10 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-3 w-1/3 rounded-md" />
      </div>
      <Skeleton className="h-5 w-16 rounded-md" />
    </div>
  )
}
