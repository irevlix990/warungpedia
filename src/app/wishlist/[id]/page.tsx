import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { getWishlistById } from '@/services/social-service'
import { Card, EmptyState, SectionTitle } from '@/components/ui'
import { productThumbnail, productPriceParts } from '@/utils/product'
import { RatingStars } from '@/components/features/social/rating-stars'
import { RemoveFromWishlistButton } from '@/components/features/social/remove-from-wishlist-button'
import { WishlistSettings } from '@/components/features/social/wishlist-settings'
import type { Product } from '@/types/product'

export const metadata: Metadata = {
  title: 'Wishlist | Warungpedia',
}

export default async function WishlistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireUser()
  const t = getDictionary()
  const { id } = await params
  const data = await getWishlistById(id)
  if (!data) notFound()

  return (
    <main className="container-wp py-10">
      <SectionTitle
        title={data.wishlist.name}
        action={<WishlistSettings wishlistId={id} currentName={data.wishlist.name} t={t.social} />}
      />

      {data.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={t.social.emptyCollection}
            action={
              <Link
                href="/search"
                className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
              >
                {t.social.browse} →
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {data.items.map(({ product, notes }) => (
            <WishlistItemRow
              key={product.id}
              wishlistId={id}
              product={product}
              notes={notes}
              t={t}
            />
          ))}
        </div>
      )}
    </main>
  )
}

function WishlistItemRow({
  wishlistId,
  product,
  notes,
  t,
}: {
  wishlistId: string
  product: Product & { storeSlug: string }
  notes: string | null
  t: ReturnType<typeof getDictionary>
}) {
  const thumb = productThumbnail(product.imageUrls)
  const { priceLabel } = productPriceParts(product.price, product.compareAtPrice)
  return (
    <Card className="flex gap-4 p-4">
      <Link
        href={`/store/${product.storeSlug}/product/${product.slug}`}
        className="shrink-0"
      >
        <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
          {thumb ? (
            <Image src={thumb} alt={product.name} fill className="object-cover" sizes="80px" />
          ) : (
            <span className="text-xs text-neutral-400">{t.product.imageFallback}</span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/store/${product.storeSlug}/product/${product.slug}`}
              className="font-semibold text-neutral-900 hover:text-brand-600 dark:text-neutral-50 dark:hover:text-brand-300"
            >
              {product.name}
            </Link>
            <div className="mt-0.5 flex items-center gap-1.5">
              <RatingStars rating={product.ratingAvg} size="sm" />
              <span className="text-sm font-bold text-brand-700 dark:text-brand-300">
                {priceLabel}
              </span>
            </div>
            {notes ? (
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {t.social.notes}: {notes}
              </p>
            ) : null}
          </div>
          <RemoveFromWishlistButton
            wishlistId={wishlistId}
            productId={product.id}
            label={t.social.removeFromWishlist}
          />
        </div>
      </div>
    </Card>
  )
}
