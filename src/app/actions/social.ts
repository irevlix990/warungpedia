'use server'

import { revalidatePath } from 'next/cache'
import { requireUserOrThrow } from '@/lib/auth/dal'
import {
  addWishlistItemSchema,
  createWishlistSchema,
  deleteWishlistSchema,
  removeWishlistItemSchema,
  renameWishlistSchema,
  reviewSchema,
  reviewStatusSchema,
  toggleFollowSchema,
} from '@/lib/validation/social'
import {
  addToWishlist,
  createReview,
  createWishlist,
  deleteWishlist,
  recordProductView,
  removeFromWishlist,
  renameWishlist,
  setReviewHidden,
  toggleStoreFollow,
  updateReview,
} from '@/services/social-service'

export interface SocialActionState {
  errors?: Record<string, string[] | undefined>
  message?: string
  success?: boolean
}

/** Submit (create) or update a product review for a completed order. */
export async function submitReviewAction(
  _state: { errors?: Record<string, string[] | undefined>; message?: string; success?: boolean } | undefined,
  formData: FormData
) {
  await requireUserOrThrow()
  const parsed = reviewSchema.safeParse({
    orderId: formData.get('orderId')?.toString(),
    productId: formData.get('productId')?.toString(),
    rating: formData.get('rating')?.toString(),
    title: formData.get('title')?.toString(),
    body: formData.get('body')?.toString(),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  try {
    const reviewId = formData.get('reviewId')?.toString()
    if (reviewId) {
      await updateReview(reviewId, parsed.data)
    } else {
      await createReview(parsed.data.productId, parsed.data.orderId, {
        rating: parsed.data.rating,
        title: parsed.data.title,
        body: parsed.data.body,
      })
    }
  } catch (error) {
    return { message: (error as Error).message }
  }
  revalidatePath('/store/[slug]/product/[productSlug]', 'page')
  revalidatePath('/account')
  return { success: true }
}

/** Hide (or un-hide, admin only) a review. */
export async function setReviewStatusAction(formData: FormData): Promise<void> {
  await requireUserOrThrow()
  const parsed = reviewStatusSchema.safeParse({
    reviewId: formData.get('reviewId')?.toString(),
    status: formData.get('status')?.toString(),
  })
  if (!parsed.success) return
  await setReviewHidden(parsed.data.reviewId, parsed.data.status === 'HIDDEN')
  revalidatePath('/store/[slug]/product/[productSlug]', 'page')
}

/** Toggle a store follow; returns the new following state. */
export async function toggleFollowAction(formData: FormData): Promise<boolean> {
  await requireUserOrThrow()
  const parsed = toggleFollowSchema.safeParse({
    storeId: formData.get('storeId')?.toString(),
  })
  if (!parsed.success) return false
  const following = await toggleStoreFollow(parsed.data.storeId)
  revalidatePath('/store/[slug]', 'page')
  revalidatePath('/following')
  return following
}

/** Add a product to the default wishlist. */
export async function addToWishlistAction(formData: FormData): Promise<void> {
  await requireUserOrThrow()
  const parsed = addWishlistItemSchema.safeParse({
    productId: formData.get('productId')?.toString(),
    wishlistId: undefined,
    notes: undefined,
  })
  if (!parsed.success) return
  await addToWishlist(parsed.data.productId)
  revalidatePath('/store/[slug]/product/[productSlug]', 'page')
}

/** Remove a product from a wishlist. */
export async function removeFromWishlistAction(formData: FormData): Promise<void> {
  await requireUserOrThrow()
  const parsed = removeWishlistItemSchema.safeParse({
    wishlistId: formData.get('wishlistId')?.toString(),
    productId: formData.get('productId')?.toString(),
  })
  if (!parsed.success) return
  await removeFromWishlist(parsed.data.wishlistId, parsed.data.productId)
  revalidatePath('/wishlist')
}

/** Create a new wishlist collection. */
export async function createWishlistAction(
  _state: SocialActionState | undefined,
  formData: FormData
): Promise<SocialActionState> {
  await requireUserOrThrow()
  const parsed = createWishlistSchema.safeParse({
    name: formData.get('name')?.toString(),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  try {
    await createWishlist(parsed.data.name)
  } catch (error) {
    return { message: (error as Error).message }
  }
  revalidatePath('/wishlist')
  return { success: true }
}

/** Rename a wishlist collection. */
export async function renameWishlistAction(
  _state: SocialActionState | undefined,
  formData: FormData
): Promise<SocialActionState> {
  await requireUserOrThrow()
  const parsed = renameWishlistSchema.safeParse({
    wishlistId: formData.get('wishlistId')?.toString(),
    name: formData.get('name')?.toString(),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  try {
    await renameWishlist(parsed.data.wishlistId, parsed.data.name)
  } catch (error) {
    return { message: (error as Error).message }
  }
  revalidatePath('/wishlist')
  return { success: true }
}

/** Delete a wishlist collection. */
export async function deleteWishlistAction(formData: FormData): Promise<void> {
  await requireUserOrThrow()
  const parsed = deleteWishlistSchema.safeParse({
    wishlistId: formData.get('wishlistId')?.toString(),
  })
  if (!parsed.success) throw new Error('ID tidak valid.')
  await deleteWishlist(parsed.data.wishlistId)
  revalidatePath('/wishlist')
}

/** Fire-and-forget product view log; never blocks or errors. */
export async function recordProductViewAction(productId: string): Promise<void> {
  try {
    await recordProductView(productId)
  } catch {
    // best-effort
  }
}
