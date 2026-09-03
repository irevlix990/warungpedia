import { z } from 'zod'

const uuid = z.string().uuid({ message: 'ID tidak valid.' })
const requiredText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi.`)
    .max(max, `${label} terlalu panjang.`)
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} terlalu panjang.`)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined))

/** Submit (or update) a product review. */
export const reviewSchema = z.object({
  orderId: uuid,
  productId: uuid,
  rating: z.coerce
    .number({ message: 'Rating tidak valid.' })
    .int('Rating harus bilangan bulat.')
    .min(1, 'Rating minimal 1.')
    .max(5, 'Rating maksimal 5.'),
  title: optionalText(120, 'Judul'),
  body: requiredText(2000, 'Ulasan'),
})

export type ReviewValues = z.infer<typeof reviewSchema>

/** Hide / unhide a review (owner hides, admin can restore). */
export const reviewStatusSchema = z.object({
  reviewId: uuid,
  status: z.enum(['ACTIVE', 'HIDDEN'], { message: 'Status tidak valid.' }),
})

export type ReviewStatusValues = z.infer<typeof reviewStatusSchema>

/** Toggle a store follow. */
export const toggleFollowSchema = z.object({
  storeId: uuid,
})

export type ToggleFollowValues = z.infer<typeof toggleFollowSchema>

/** Create a named wishlist collection. */
export const createWishlistSchema = z.object({
  name: requiredText(80, 'Nama'),
})

export type CreateWishlistValues = z.infer<typeof createWishlistSchema>

/** Rename a wishlist collection. */
export const renameWishlistSchema = z.object({
  wishlistId: uuid,
  name: requiredText(80, 'Nama'),
})

export type RenameWishlistValues = z.infer<typeof renameWishlistSchema>

/** Delete a wishlist collection. */
export const deleteWishlistSchema = z.object({
  wishlistId: uuid,
})

export type DeleteWishlistValues = z.infer<typeof deleteWishlistSchema>

/** Add / remove a product in a wishlist. */
export const addWishlistItemSchema = z.object({
  productId: uuid,
  wishlistId: uuid.optional().nullable(),
  notes: optionalText(500, 'Catatan'),
})

export type AddWishlistItemValues = z.infer<typeof addWishlistItemSchema>

export const removeWishlistItemSchema = z.object({
  wishlistId: uuid,
  productId: uuid,
})

export type RemoveWishlistItemValues = z.infer<typeof removeWishlistItemSchema>
