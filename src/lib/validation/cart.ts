import { z } from 'zod'

const quantity = z
  .number({ message: 'Jumlah harus berupa angka.' })
  .int({ message: 'Jumlah harus bilangan bulat.' })
  .min(1, { message: 'Jumlah minimal 1.' })
  .max(99, { message: 'Jumlah maksimal 99.' })

/** Validates adding an item to the cart. */
export const addToCartSchema = z.object({
  productId: z.string().uuid({ message: 'ID produk tidak valid.' }),
  quantity,
})

/** Validates an in-place quantity update on a cart line. */
export const updateCartItemSchema = z.object({
  itemId: z.string().uuid({ message: 'ID item tidak valid.' }),
  quantity,
})

export type AddToCartValues = z.infer<typeof addToCartSchema>
export type UpdateCartItemValues = z.infer<typeof updateCartItemSchema>
