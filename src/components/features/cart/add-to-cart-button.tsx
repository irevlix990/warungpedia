'use client'

import { useActionState } from 'react'
import { addToCartAction, type CartActionState } from '@/app/actions/cart'
import { Button } from '@/components/ui/button'
import type { DictionaryCart } from '../auth/action-strings'

interface AddToCartButtonProps {
  productId: string
  maxStock: number
  t: DictionaryCart
}

export function AddToCartButton({
  productId,
  maxStock,
  t,
}: AddToCartButtonProps) {
  const [state, formAction, pending] = useActionState<
    CartActionState | undefined,
    FormData
  >(addToCartAction, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex items-center gap-3">
        <label
          htmlFor="quantity"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.quantity}
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          max={Math.min(maxStock, 99)}
          defaultValue={1}
          className="h-10 w-20 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 shadow-soft focus:border-brand-500 focus-visible:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {t.addToCart}
      </Button>
      {state?.message && (
        <p className="text-sm text-brand-600 dark:text-brand-300">
          {state.message}
        </p>
      )}
    </form>
  )
}
