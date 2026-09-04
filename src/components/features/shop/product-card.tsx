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
      className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200/90 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-card dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-700"
    >
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {thumb ? (
          <Image
            src={thumb}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <span className="text-xs text-neutral-400">{t.imageFallback}</span>
        )}
        {discountPercent && (
          <span className="absolute left-2 top-2 rounded-full bg-danger-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
            {discountPercent}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2 p-3.5">
        <div className="space-y-1">
          <p className="line-clamp-2 text-sm font-medium text-neutral-800 transition-colors group-hover:text-brand-700 dark:text-neutral-100 dark:group-hover:text-brand-300">
            {product.name}
          </p>
          {storeName && (
            <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">
              🏪 {storeName}
            </p>
          )}
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5">
            <RatingStars rating={product.ratingAvg} size="sm" />
            {product.reviewsCount > 0 && (
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                ({product.reviewsCount})
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="font-display text-base font-bold text-brand-700 dark:text-brand-300">
              {priceLabel}
            </p>
            {originalLabel && (
              <p className="text-xs text-neutral-400 line-through">
                {originalLabel}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <div>
              {level === 'out' ? (
                <Badge variant="danger">{t.stockOut}</Badge>
              ) : level === 'low' ? (
                <Badge variant="warning">{t.stockLow}</Badge>
              ) : (
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  Stok: {product.stock}
                </span>
              )}
            </div>

            <span className="text-xs font-semibold text-brand-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-brand-400">
              Lihat Detail →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
