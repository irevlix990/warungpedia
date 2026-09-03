import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Breadcrumbs,
  Card,
  EmptyState,
  SectionTitle,
} from '@/components/ui'
import { CategoryCard } from '@/components/features/catalog/category-card'
import { ProductCard } from '@/components/features/shop/product-card'
import {
  getCategories,
  getCategoryBySlug,
} from '@/services/catalog-service'
import { searchProducts } from '@/services/product-service'
import { childrenOf, groupByParent } from '@/utils/catalog'
import { getDictionary } from '@/lib/i18n'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  props: CategoryPageProps
): Promise<Metadata> {
  const { slug } = await props.params
  const category = await getCategoryBySlug(slug).catch(() => null)
  return {
    title: category?.name ?? 'Kategori',
    description: category?.description ?? undefined,
  }
}

export default async function CategoryPage(props: CategoryPageProps) {
  const { slug } = await props.params
  const t = getDictionary()

  const category = await getCategoryBySlug(slug).catch(() => null)
  if (!category) notFound()

  const categories = await getCategories().catch(() => null) ?? []
  const grouped = groupByParent(categories)
  const children = childrenOf(grouped, category.id)

  const productsResult = await searchProducts({
    term: '',
    categoryId: category.id,
  }).catch(() => null)
  const products = productsResult?.products ?? []

  return (
    <main className="container-wp py-10">
      <Breadcrumbs
        items={[
          { label: t.nav.home, href: '/' },
          { label: t.nav.categories, href: '/categories' },
          { label: category.name },
        ]}
      />

      <div className="mt-4 space-y-1">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
          {category.name}
        </h1>
        {category.description ? (
          <p className="max-w-2xl text-neutral-500 dark:text-neutral-400">
            {category.description}
          </p>
        ) : null}
      </div>

      {children.length > 0 ? (
        <section className="mt-8">
          <SectionTitle title={t.nav.categories} />
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {children.map((child) => (
              <CategoryCard key={child.id} category={child} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <SectionTitle title={t.shop.productsInCategory} />
        {products.length === 0 ? (
          <Card className="mt-4 p-6">
            <EmptyState
              title={t.shop.productsInCategory}
              description={t.product.noProducts}
              action={
                <Link
                  href="/categories"
                  className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
                >
                  {t.shop.backToCategories}
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                storeSlug={product.storeSlug}
                storeName={product.storeName}
                t={t.product}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}