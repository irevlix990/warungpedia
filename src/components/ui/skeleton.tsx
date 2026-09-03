import { cn } from '@/utils/cn'

/** Loading placeholder block used while data is being fetched. */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
