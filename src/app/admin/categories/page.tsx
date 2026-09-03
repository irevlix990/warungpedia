import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n'
import { getAllCategories } from '@/services/admin-service'
import { setCategoryActiveAction } from '@/app/actions/admin'
import { Card, EmptyState, Badge } from '@/components/ui'
import CategoryForm from '@/components/features/admin/category-form'

export const metadata: Metadata = {
  title: 'Kategori | Admin ',
}

export default async function AdminCategoriesPage() {
  const t = getDictionary().admin
  const categories = await getAllCategories()
  const parents = categories.map((c) => ({ id: c.id, name: c.name }))

  const formLabels = {
    newCategory: t.newCategory,
    editCategory: t.editCategory,
    name: t.name,
    slug: t.slug,
    description: t.categoryDescription,
    parent: t.parent,
    sortOrder: t.sortOrder,
    imageUrl: t.imageUrl,
    submit: t.submit,
    none: 'â€”',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {t.categories}
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          {t.categoriesSubtitle}
        </p>
      </div>

      <Card className="p-5">
        <h3 className="mb-4 font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
          {t.newCategory}
        </h3>
        <CategoryForm parents={parents} labels={formLabels} />
      </Card>

      {categories.length === 0 ? (
        <EmptyState title={t.noCategories} />
      ) : (
        <div className="space-y-3">
          {categories.map((category) => (
            <Card key={category.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {category.name}
                  </p>
                  <p className="text-xs text-neutral-500">{category.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  {category.isActive ? (
                    <Badge variant="success">{t.active}</Badge>
                  ) : (
                    <Badge variant="neutral">{t.inactive}</Badge>
                  )}
                  <form action={setCategoryActiveAction}>
                    <input type="hidden" name="id" value={category.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={category.isActive ? '0' : '1'}
                    />
                    <button
                      type="submit"
                      className="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
                    >
                      {t.toggleActive}
                    </button>
                  </form>
                </div>
              </div>
              <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <CategoryForm
                  editCategory={category}
                  parents={parents}
                  labels={formLabels}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
