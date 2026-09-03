'use client'

import { useTransition } from 'react'
import {
  addToWishlistAction,
  removeFromWishlistAction,
} from '@/app/actions/social'
import { Button } from '@/components/ui/button'
import type { DictionarySocial } from '../auth/action-strings'

interface AddToWishlistButtonProps {
  productId: string
  /** Whether the product is already in the acting user's wishlist. */
  saved: boolean
  /** Wishlist id used for removal (the default collection). */
  wishlistId: string | null
  t: DictionarySocial
}

export function AddToWishlistButton({
  productId,
  saved,
  wishlistId,
  t,
}: AddToWishlistButtonProps) {
  const [pending, startTransition] = useTransition()

  function handle() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('productId', productId)
      if (saved && wishlistId) {
        fd.set('wishlistId', wishlistId)
        await removeFromWishlistAction(fd)
      } else {
        await addToWishlistAction(fd)
      }
    })
  }

  return (
    <Button
      type="button"
      variant={saved ? 'secondary' : 'outline'}
      onClick={handle}
      disabled={pending}
      className="w-full"
    >
      {saved ? `\u2713 ${t.saved}` : t.addToWishlist}
    </Button>
  )
}
