'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  removeCartItemAction,
  updateCartItemAction,
  type CartActionState,
} from '@/app/actions/cart'
import { Button } from '@/components/ui/button'
import { formatIDR } from '@/utils/cn'
import { productThumbnail } from '@/utils/product'
import type { Cart } from '@/types/cart'
import type { DictionaryCart } from '../auth/action-strings'

interface CartListProps {
  cart: Cart
  t: DictionaryCart
}

export function CartList({ cart, t }: CartListProps) {
  const [state, updateAction, updating] = useActionState<
    CartActionState | undefined,
    FormData
  >(updateCartItemAction, undefined)

  return (
    <ul className="space-y-4">
      {cart.items.map((item) => {
        const thumb = productThumbnail(item.product.imageUrls)
        return (
          <li
            key={item.id}
            className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4 sm:flex-row sm:items-center dark:border-neutral-800"
          >
            <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {thumb ? (
                <Image
                  src={thumb}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <Link
                href={`/store/${item.storeSlug}/product/${item.product.slug}`}
                className="line-clamp-2 font-medium text-neutral-900 hover:underline dark:text-neutral-100"
              >
                {item.product.name}
              </Link>
              <p className="mt-0.5 text-sm font-semibold text-brand-700 dark:text-brand-300">
                {formatIDR(item.product.price)}
              </p>
            </div>

            <form action={updateAction} className="flex items-center gap-2">
              <input type="hidden" name="itemId" value={item.id} />
              <label className="sr-only" htmlFor={`qty-${item.id}`}>
                {t.quantity}
              </label>
              <input
                id={`qty-${item.id}`}
                name="quantity"
                type="number"
                min={1}
                max={Math.min(item.product.stock, 99)}
                defaultValue={item.quantity}
                className="h-9 w-16 rounded-lg border border-neutral-300 bg-white px-2 text-sm focus:border-brand-500 focus-visible:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
              <Button type="submit" variant="outline" size="sm" disabled={updating}>
                {t.save}
              </Button>
            </form>

            <form action={removeCartItemAction}>
              <input type="hidden" name="itemId" value={item.id} />
              <Button type="submit" variant="ghost" size="sm">
                {t.remove}
              </Button>
            </form>
          </li>
        )
      })}
      {state?.message && (
        <li className="text-sm text-danger-600">{state.message}</li>
      )}
    </ul>
  )
}
