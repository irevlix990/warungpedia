import type { Metadata } from 'next'
import { Card, EmptyState } from '@/components/ui'
import { CategoryCard } from '@/components/features/catalog/category-card'
import { getCategories } from '@/services/catalog-service'
import {
  childrenOf,
  groupByParent,
  topLevelCategories,
} from '@/utils/catalog'
import { getDictionary } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Kategori',
  description: 'Telusuri semua kategori produk di Warungpedia.',
}

export default async function CategoriesPage() {
  const t = getDictionary()
  const categories = await getCategories().catch(() => null) ?? []
  const grouped = groupByParent(categories)
  const roots = topLevelCategories(grouped)

  return (
    <main className="container-wp py-10">
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
          {t.shop.categoriesTitle}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          {t.shop.categoriesSubtitle}
        </p>
      </div>

      {roots.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {roots.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              childCount={childrenOf(grouped, category.id).length}
            />
          ))}
        </div>
      ) : (
        <Card className="mt-8 p-6">
          <EmptyState
            title={t.shop.noCategories}
            description={t.shop.loadFailed}
          />
        </Card>
      )}
    </main>
  )
}