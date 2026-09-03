import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth/dal'
import { getStoreBySlug } from '@/services/store-service'
import { getPublicProductInStore } from '@/services/product-service'
import {
  getReviewsForProduct,
  getMyReviewForProduct,
  getReviewEligibility,
  getFollowedStoreIds,
  getWishlistedProductIds,
  getMyWishlists,
  getRelatedProducts,
} from '@/services/social-service'
import { Badge, Breadcrumbs } from '@/components/ui'
import { AddToCartButton } from '@/components/features/cart/add-to-cart-button'
import { stockLevel, productThumbnail, productPriceParts } from '@/utils/product'
import { ReviewsSection } from '@/components/features/social/reviews-section'
import { ProductShelf } from '@/components/features/social/product-shelf'
import { AddToWishlistButton } from '@/components/features/social/add-to-wishlist-button'
import { StoreFollowButton } from '@/components/features/social/store-follow-button'
import { RecordProductView } from '@/components/features/social/record-view'
import {
  breadcrumbJsonLd,
  buildMetadata,
  productJsonLd,
} from '@/lib/seo/seo'
import { JsonLd } from '@/components/seo/json-ld'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>
}): Promise<Metadata> {
  const { slug, productSlug } = await params
  const [store, product] = await Promise.all([
    getStoreBySlug(slug).catch(() => null),
    getPublicProductInStore(slug, productSlug).catch(() => null),
  ])
  if (!store || !product) {
    return buildMetadata({
      title: 'Produk',
      path: `/store/${slug}/product/${productSlug}`,
      noindex: true,
    })
  }
  const path = `/store/${store.slug}/product/${product.slug}`
  return buildMetadata({
    title: product.name,
    description: product.description ?? undefined,
    path,
    ogImage: productThumbnail(product.imageUrls) ?? undefined,
  })
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>
}) {
  const t = getDictionary()
  const { slug, productSlug } = await params

  const store = await getStoreBySlug(slug).catch(() => null)
  if (!store) notFound()

  const product = await getPublicProductInStore(slug, productSlug).catch(
    () => null
  )
  if (!product) notFound()

  const user = await getCurrentUser()
  const isAuthed = Boolean(user)

  const [reviews, myReview, eligibility, followedStoreIds, wishlistProductIds, myWishlists, related] =
    await Promise.all([
      getReviewsForProduct(product.id),
      isAuthed ? getMyReviewForProduct(product.id) : Promise.resolve(null),
      isAuthed ? getReviewEligibility(product.id) : Promise.resolve({ orderId: null, already: false }),
      isAuthed ? getFollowedStoreIds() : Promise.resolve(new Set<string>()),
      isAuthed
        ? getWishlistedProductIds()
        : Promise.resolve(new Set<string>()),
      isAuthed ? getMyWishlists() : Promise.resolve([]),
      getRelatedProducts(product.id, 8),
    ])

  const saved = wishlistProductIds.has(product.id)
  const wishlistId = myWishlists[0]?.id ?? null
  const following = followedStoreIds.has(store.id)

  const thumb = productThumbnail(product.imageUrls)
  const { priceLabel, originalLabel, discountPercent } = productPriceParts(
    product.price,
    product.compareAtPrice
  )
  const level = stockLevel(product.stock, product.lowStockThreshold)

  return (
    <main className="container-wp py-10">
      <JsonLd
        data={breadcrumbJsonLd([
          { label: t.nav.home, path: '/' },
          { label: store.name, path: `/store/${store.slug}` },
          { label: product.name, path: `/store/${store.slug}/product/${product.slug}` },
        ])}
      />
      <JsonLd
        data={productJsonLd({
          name: product.name,
          description: product.description,
          imageUrl: thumb,
          price: product.price,
          availability: product.stock > 0 ? 'InStock' : 'OutOfStock',
          url: `/store/${store.slug}/product/${product.slug}`,
          brand: product.brand,
          sku: product.id,
          ratingAvg: product.reviewsCount > 0 ? product.ratingAvg : undefined,
          reviewsCount: product.reviewsCount > 0 ? product.reviewsCount : undefined,
        })}
      />
      <RecordProductView productId={product.id} />
      <Breadcrumbs
        items={[
          { label: t.nav.home, href: '/' },
          { label: store.name, href: `/store/${store.slug}` },
          { label: product.name, href: `/store/${store.slug}/product/${product.slug}` },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800">
          {thumb ? (
            <Image
              src={thumb}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
            />
          ) : (
            <span className="text-sm text-neutral-400">
              {t.product.imageFallback}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                {product.name}
              </h1>
              {product.isFeatured && (
                <Badge variant="brand">{t.product.featured}</Badge>
              )}
            </div>
            {product.brand && (
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {t.product.brand}: {product.brand}
              </p>
            )}
            {product.reviewsCount > 0 && (
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {t.social.rating}: {product.ratingAvg.toFixed(1)} ·{' '}
                {product.reviewsCount} {t.social.reviewCount}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold text-brand-700 dark:text-brand-300">
              {priceLabel}
            </p>
            {originalLabel && (
              <p className="text-base text-neutral-400 line-through">
                {originalLabel}
              </p>
            )}
            {discountPercent && (
              <Badge variant="danger">{discountPercent}%</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {level === 'out' ? (
              <Badge variant="danger">{t.product.outOfStock}</Badge>
            ) : level === 'low' ? (
              <Badge variant="warning">
                {t.product.stockLow} · {product.stock}
              </Badge>
            ) : (
              <Badge variant="success">{t.product.stockIn}</Badge>
            )}
            <Badge variant="neutral">
              {product.condition === 'new'
                ? t.product.conditionNew
                : t.product.conditionUsed}
            </Badge>
            {product.weightGrams ? (
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {product.weightGrams} {t.product.weightSuffix}
              </span>
            ) : null}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                  {store.name}
                </p>
                <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                  {store.city ?? ''}
                  {store.city && store.province ? ', ' : ''}
                  {store.province}
                </p>
                {isAuthed && (
                  <div className="mt-2">
                    <StoreFollowButton
                      storeId={store.id}
                      following={following}
                      t={t.social}
                    />
                  </div>
                )}
              </div>
              <Link
                href={`/store/${store.slug}`}
                className="inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
              >
                {t.seller.viewStore} →
              </Link>
            </div>
            {store.ratingCount > 0 && (
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                {t.social.storeRating}: {store.ratingAvg.toFixed(1)} ·{' '}
                {store.ratingCount} {t.social.reviewCount}
              </p>
            )}
          </div>

          {level !== 'out' && (
            <AddToCartButton
              productId={product.id}
              maxStock={product.stock}
              t={t.cart}
            />
          )}

          {isAuthed && (
            <AddToWishlistButton
              productId={product.id}
              saved={saved}
              wishlistId={wishlistId}
              t={t.social}
            />
          )}

          {product.description && (
            <div>
              <h2 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
                {t.product.detail}
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      <ReviewsSection
        productId={product.id}
        reviews={reviews}
        ratingAvg={product.ratingAvg}
        myReview={myReview}
        reviewableOrderId={eligibility.orderId}
        isAuthed={isAuthed}
        t={t.social}
      />

      <ProductShelf
        title={t.social.relatedProducts}
        products={related}
        t={t.product}
      />
    </main>
  )
}
