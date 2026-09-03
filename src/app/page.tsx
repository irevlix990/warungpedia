import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Card,
  EmptyState,
  SectionTitle,
  buttonVariants,
} from '@/components/ui'
import { CategoryCard } from '@/components/features/catalog/category-card'
import { getCategories } from '@/services/catalog-service'
import { getCurrentUser } from '@/lib/auth/dal'
import { getRecentlyViewedProducts } from '@/services/social-service'
import { ProductShelf } from '@/components/features/social/product-shelf'
import {
  childrenOf,
  groupByParent,
  topLevelCategories,
} from '@/utils/catalog'
import { getDictionary } from '@/lib/i18n'
import { buildMetadata, organizationJsonLd } from '@/lib/seo/seo'
import { JsonLd } from '@/components/seo/json-ld'

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary()
  return buildMetadata({
    title: t.seo.homeTitle,
    description: t.seo.homeDescription,
    path: '/',
  })
}

export default async function HomePage() {
  const t = getDictionary()
  const categories = await getCategories().catch(() => null) ?? []
  const grouped = groupByParent(categories)
  const popular = topLevelCategories(grouped).slice(0, 8)

  const user = await getCurrentUser()
  const recentlyViewed = user
    ? await getRecentlyViewedProducts(8).catch(() => [])
    : []

  return (
    <main>
      <JsonLd data={organizationJsonLd()} />
      <section className="border-b border-neutral-200 bg-gradient-to-b from-brand-50 via-neutral-50 to-neutral-50 dark:border-neutral-800 dark:from-brand-950/40 dark:via-neutral-950 dark:to-neutral-950">
        <div className="container-wp flex flex-col items-center gap-6 py-16 text-center sm:py-24">
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
            {t.home.heroBadge}
          </span>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-5xl">
            {t.home.heroTitle}
            <br />
            <span className="text-brand-600 dark:text-brand-300">
              {t.home.heroSubtitle}
            </span>
          </h1>
          <p className="max-w-xl text-neutral-600 dark:text-neutral-300">
            {t.home.heroDescription}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/categories"
              className={buttonVariants({ variant: 'primary', size: 'lg' })}
            >
              {t.home.startShopping}
            </Link>
            <Link
              href="/search"
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              {t.common.search}
            </Link>
          </div>
        </div>
      </section>

      <section className="container-wp py-12">
        <SectionTitle
          title={t.home.trendingCategories}
          action={
            <Link
              href="/categories"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {t.common.viewAll}
            </Link>
          }
        />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {popular.length > 0 ? (
            popular.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                childCount={childrenOf(grouped, category.id).length}
              />
            ))
          ) : (
            <Card className="col-span-full p-6">
              <EmptyState
                title={t.shop.noCategories}
                description={t.shop.loadFailed}
              />
            </Card>
          )}
        </div>
      </section>

      <section className="container-wp">
        <ProductShelf
          title={t.social.recentlyViewed}
          products={recentlyViewed}
          t={t.product}
        />
      </section>

      <section className="container-wp pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-6">
            <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
              {t.home.valueSafety}
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {t.home.valueSafetyDesc}
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
              {t.home.valueFast}
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {t.home.valueFastDesc}
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
              {t.home.valueEasyPayment}
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {t.home.valueEasyPaymentDesc}
            </p>
          </Card>
        </div>
      </section>
    </main>
  )
}