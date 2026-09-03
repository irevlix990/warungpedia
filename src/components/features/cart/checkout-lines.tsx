import Image from 'next/image'
import Link from 'next/link'
import { formatIDR } from '@/utils/cn'
import { productThumbnail } from '@/utils/product'
import type { Cart } from '@/types/cart'
import type { DictionaryCart } from '../auth/action-strings'

interface CartCheckoutLinesProps {
  cart: Cart
  t: DictionaryCart
}

export function CartCheckoutLines({ cart, t }: CartCheckoutLinesProps) {
  return (
    <div>
      <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-50">
        {t.items}
      </h2>
      <ul className="mt-4 divide-y divide-neutral-200 dark:divide-neutral-800">
        {cart.items.map((item) => {
          const thumb = productThumbnail(item.product.imageUrls)
          return (
            <li key={item.id} className="flex gap-4 py-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/store/${item.storeSlug}/product/${item.product.slug}`}
                  className="line-clamp-2 text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                >
                  {item.product.name}
                </Link>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {item.quantity} × {formatIDR(item.product.price)}
                </p>
              </div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {formatIDR(item.product.price * item.quantity)}
              </p>
            </li>
          )
        })}
      </ul>
      <Link
        href="/cart"
        className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
      >
        ← {t.backToCart}
      </Link>
    </div>
  )
}
