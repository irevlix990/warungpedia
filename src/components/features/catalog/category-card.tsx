import Link from 'next/link'
import { cn } from '@/utils/cn'
import { getDictionary } from '@/lib/i18n'
import { getCategoryVisual } from '@/utils/category-icons'
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
  const visual = getCategoryVisual(category.slug)

  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        'group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-4.5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-card dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-700',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'grid size-12 place-items-center rounded-xl text-2xl transition-transform duration-200 group-hover:scale-110 shadow-xs',
            visual.bgLight,
            visual.bgDark
          )}
        >
          <span role="img" aria-label={category.name}>
            {visual.emoji}
          </span>
        </span>
        <span className="text-xs font-semibold text-neutral-400 group-hover:text-brand-600 transition-colors dark:text-neutral-500 dark:group-hover:text-brand-400">
          →
        </span>
      </div>

      <div>
        <span className="block font-display text-sm font-bold text-neutral-900 transition-colors group-hover:text-brand-600 dark:text-neutral-50 dark:group-hover:text-brand-300">
          {category.name}
        </span>
        {category.description ? (
          <span className="mt-1 line-clamp-2 block text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
            {category.description}
          </span>
        ) : null}
        {childCount !== undefined ? (
          <span className="mt-2 inline-block rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {t.shop.productCount.replace('{count}', String(childCount))}
          </span>
        ) : null}
      </div>
    </Link>
  )
}