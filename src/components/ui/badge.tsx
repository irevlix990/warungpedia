import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        brand: 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200',
        neutral:
          'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
        success:
          'bg-success-50 text-success-700 dark:bg-success-600/20 dark:text-success-500',
        warning:
          'bg-warning-50 text-warning-700 dark:bg-warning-600/20 dark:text-warning-500',
        danger:
          'bg-danger-50 text-danger-700 dark:bg-danger-600/20 dark:text-danger-500',
        info: 'bg-info-50 text-info-700 dark:bg-info-600/20 dark:text-info-500',
        outline:
          'border border-neutral-300 text-neutral-700 dark:border-neutral-600 dark:text-neutral-200',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
