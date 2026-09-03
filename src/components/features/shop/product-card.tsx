import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui'
import { stockLevel, productThumbnail, productPriceParts } from '@/utils/product'
import { RatingStars } from '../social/rating-stars'
import type { Product } from '@/types/product'
import type { DictionaryProduct } from '../auth/action-strings'

interface ProductCardProps {
  product: Product
  storeSlug: string
  storeName?: string
  t: DictionaryProduct
}

export function ProductCard({
  product,
  storeSlug,
  storeName,
  t,
}: ProductCardProps) {
  const thumb = productThumbnail(product.imageUrls)
  const effectivePrice = product.discountedPrice ?? product.price
  const effectiveCompare =
    product.discountedPrice != null ? product.price : product.compareAtPrice
  const { priceLabel, originalLabel, discountPercent } = productPriceParts(
    effectivePrice,
    effectiveCompare
  )
  const level = stockLevel(product.stock, product.lowStockThreshold)

  return (
    <Link
      href={`/store/${storeSlug}/product/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-soft dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {thumb ? (
          <Image
            src={thumb}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <span className="text-xs text-neutral-400">{t.imageFallback}</span>
        )}
        {discountPercent && (
          <span className="absolute left-2 top-2 rounded-full bg-danger-600 px-2 py-0.5 text-xs font-bold text-white">
            {discountPercent}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">
          {product.name}
        </p>
        {storeName && (
          <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">
            {storeName}
          </p>
        )}
        <div className="flex items-center gap-1.5">
          <RatingStars rating={product.ratingAvg} size="sm" />
          {product.reviewsCount > 0 && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              ({product.reviewsCount})
            </span>
          )}
        </div>
        <p className="text-base font-bold text-brand-700 dark:text-brand-300">
          {priceLabel}
        </p>
        {originalLabel && (
          <p className="text-xs text-neutral-400 line-through">
            {originalLabel}
          </p>
        )}
        <div className="mt-1">
          {level === 'out' ? (
            <Badge variant="danger">{t.stockOut}</Badge>
          ) : level === 'low' ? (
            <Badge variant="warning">{t.stockLow}</Badge>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
