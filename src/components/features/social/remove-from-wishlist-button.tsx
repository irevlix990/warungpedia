'use client'

import { useTransition } from 'react'
import { removeFromWishlistAction } from '@/app/actions/social'
import { Button } from '@/components/ui/button'

interface RemoveFromWishlistButtonProps {
  wishlistId: string
  productId: string
  label: string
}

export function RemoveFromWishlistButton({
  wishlistId,
  productId,
  label,
}: RemoveFromWishlistButtonProps) {
  const [pending, startTransition] = useTransition()
  function handle() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('wishlistId', wishlistId)
      fd.set('productId', productId)
      await removeFromWishlistAction(fd)
    })
  }
  return (
    <Button type="button" variant="ghost" size="sm" onClick={handle} disabled={pending}>
      {label}
    </Button>
  )
}
