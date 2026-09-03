import Link from 'next/link'
import { cn } from '@/utils/cn'
import { getDictionary } from '@/lib/i18n'
import type { Category } from '@/types/catalog'

interface CategoryCardProps {
  category: Category
  childCount?: number
  className?: string
}

/** Tiles listing a category on the home page and catalog pages. */
export function CategoryCard({
  category,
  childCount,
  className,
}: CategoryCardProps) {
  const t = getDictionary()
  const badge = category.name.charAt(0).toUpperCase()

  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        'group flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-700',
        className
      )}
    >
      <span className="grid size-11 place-items-center rounded-lg bg-brand-100 font-display text-base font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-200">
        {badge}
      </span>
      <span>
        <span className="block font-display text-sm font-bold text-neutral-900 group-hover:text-brand-700 dark:text-neutral-50 dark:group-hover:text-brand-300">
          {category.name}
        </span>
        {category.description ? (
          <span className="mt-1 line-clamp-2 block text-xs text-neutral-500 dark:text-neutral-400">
            {category.description}
          </span>
        ) : null}
        {childCount !== undefined ? (
          <span className="mt-1 block text-xs font-medium text-neutral-400 dark:text-neutral-500">
            {t.shop.productCount.replace('{count}', String(childCount))}
          </span>
        ) : null}
      </span>
    </Link>
  )
}