import { cn } from '@/utils/cn'

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'size-4 border-2',
  md: 'size-6 border-2',
  lg: 'size-8 border-[3px]',
}

/** Accessible loading spinner (aria-hidden, conveyed by surrounding text). */
export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex items-center justify-center', className)}
      {...props}
    >
      <div
        aria-hidden
        className={cn(
          'animate-spin rounded-full border-brand-300 border-t-brand-600',
          sizeMap[size]
        )}
      />
      <span className="sr-only">Memuat</span>
    </div>
  )
}
