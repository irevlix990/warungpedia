import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Card,
  EmptyState,
  SectionTitle,
  ScrollReveal,
  buttonVariants,
} from '@/components/ui'
import { CategoryCard } from '@/components/features/catalog/category-card'
import { HeroBanner } from '@/components/features/shop/hero-banner'
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
      <HeroBanner />

      <section className="container-wp py-12">
        <ScrollReveal direction="up">
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
        </ScrollReveal>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {popular.length > 0 ? (
            popular.map((category, idx) => (
              <ScrollReveal key={category.id} direction="up" delay={idx * 40}>
                <CategoryCard
                  category={category}
                  childCount={childrenOf(grouped, category.id).length}
                />
              </ScrollReveal>
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

      <ScrollReveal direction="up">
        <section className="container-wp">
          <ProductShelf
            title={t.social.recentlyViewed}
            products={recentlyViewed}
            t={t.product}
          />
        </section>
      </ScrollReveal>

      <section className="container-wp pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          <ScrollReveal direction="up" delay={0}>
            <Card className="p-6">
              <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
                {t.home.valueSafety}
              </h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {t.home.valueSafetyDesc}
              </p>
            </Card>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={60}>
            <Card className="p-6">
              <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
                {t.home.valueFast}
              </h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {t.home.valueFastDesc}
              </p>
            </Card>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={120}>
            <Card className="p-6">
              <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
                {t.home.valueEasyPayment}
              </h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {t.home.valueEasyPaymentDesc}
              </p>
            </Card>
          </ScrollReveal>
        </div>
      </section>
    </main>
  )
}