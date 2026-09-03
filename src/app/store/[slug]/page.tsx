import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { getDictionary } from '@/lib/i18n'
import { getStoreBySlug } from '@/services/store-service'
import { getPublicProductsByStore } from '@/services/product-service'
import { Badge, Breadcrumbs, EmptyState } from '@/components/ui'
import { ProductCard } from '@/components/features/shop/product-card'
import { breadcrumbJsonLd, buildMetadata } from '@/lib/seo/seo'
import { JsonLd } from '@/components/seo/json-ld'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const t = getDictionary()
  const { slug } = await params
  const store = await getStoreBySlug(slug).catch(() => null)
  if (!store) {
    return buildMetadata({ title: t.seo.storeTitle, path: `/store/${slug}`, noindex: true })
  }
  return buildMetadata({
    title: store.name,
    description: store.tagline ?? store.description ?? undefined,
    path: `/store/${slug}`,
    ogImage: store.logoUrl ?? store.bannerUrl ?? undefined,
  })
}

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const t = getDictionary()
  const { slug } = await params

  const store = await getStoreBySlug(slug).catch(() => null)
  if (!store) notFound()

  const products = await getPublicProductsByStore(store.id)

  return (
    <main className="container-wp py-10">
      <JsonLd
        data={breadcrumbJsonLd([
          { label: t.nav.home, path: '/' },
          { label: store.name, path: `/store/${store.slug}` },
        ])}
      />
      <Breadcrumbs
        items={[
          { label: t.nav.home, href: '/' },
          { label: store.name, href: `/store/${store.slug}` },
        ]}
      />

      <section className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        {store.bannerUrl && (
          <div className="relative h-40 w-full overflow-hidden bg-brand-100 dark:bg-brand-900/30 sm:h-56">
            <Image
              src={store.bannerUrl}
              alt={store.name}
              fill
              sizes="(min-width: 640px) 100vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          {store.logoUrl && (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-100 dark:bg-brand-900/30">
              <Image
                src={store.logoUrl}
                alt={store.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                {store.name}
              </h1>
              <Badge variant="success">{t.seller.statusActive}</Badge>
            </div>
            {store.tagline && (
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                {store.tagline}
              </p>
            )}
            {store.province && (
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                {store.city ?? ''}
                {store.city && store.province ? ', ' : ''}
                {store.province}
              </p>
            )}
          </div>
        </div>
      </section>

      {store.description && (
        <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          {store.description}
        </p>
      )}

      <section className="mt-8">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-50">
            {t.product.products}
          </h2>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {products.length}
          </span>
        </div>

        {products.length === 0 ? (
          <EmptyState title={t.product.noProducts} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                storeSlug={store.slug}
                t={t.product}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
