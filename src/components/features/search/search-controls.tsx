'use client'

import { useRouter } from 'next/navigation'
import { PRODUCT_SORTS, type ProductSort } from '@/utils/search'
import type { Category } from '@/types/catalog'
import type { DictionarySearch } from '../auth/action-strings'

interface SearchControlsProps {
  term: string
  categoryId: string | null
  sort: ProductSort
  categories: Category[]
  t: DictionarySearch
}

function buildUrl(term: string, categoryId: string | null, sort: ProductSort) {
  const params = new URLSearchParams()
  if (term) params.set('q', term)
  if (categoryId) params.set('cat', categoryId)
  if (sort !== 'relevancy') params.set('sort', sort)
  const qs = params.toString()
  return qs ? `/search?${qs}` : '/search'
}

export function SearchControls({
  term,
  categoryId,
  sort,
  categories,
  t,
}: SearchControlsProps) {
  const router = useRouter()

  const sortLabel: Record<ProductSort, string> = {
    relevancy: t.sortRelevancy,
    newest: t.sortNewest,
    'price-asc': t.sortPriceAsc,
    'price-desc': t.sortPriceDesc,
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
        <span className="font-medium">{t.categoryFilter}</span>
        <select
          value={categoryId ?? ''}
          onChange={(e) =>
            router.push(buildUrl(term, e.target.value, sort))
          }
          className="h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm text-neutral-800 focus:border-brand-500 focus-visible:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          <option value="">{t.allCategories}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
        <span className="font-medium">{t.sortBy}</span>
        <select
          value={sort}
          onChange={(e) =>
            router.push(
              buildUrl(term, categoryId, e.target.value as ProductSort)
            )
          }
          className="h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm text-neutral-800 focus:border-brand-500 focus-visible:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          {PRODUCT_SORTS.map((value) => (
            <option key={value} value={value}>
              {sortLabel[value]}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
