'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUserOrThrow } from '@/lib/auth/dal'
import { addToCartSchema, updateCartItemSchema } from '@/lib/validation/cart'
import {
  addToCart,
  placeOrder,
  removeFromCart,
  updateCartItem,
} from '@/services/cart-service'
import { createClient } from '@/lib/supabase/server'

export interface CartActionState {
  errors?: Record<string, string[] | undefined>
  message?: string
  success?: boolean
}

/** BUYER adds an item to their cart. */
export async function addToCartAction(
  _state: CartActionState | undefined,
  formData: FormData
): Promise<CartActionState> {
  await requireUserOrThrow()

  const parsed = addToCartSchema.safeParse({
    productId: formData.get('productId')?.toString(),
    quantity: Number(formData.get('quantity')),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await addToCart(parsed.data.productId, parsed.data.quantity)
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath('/cart')
  return { success: true, message: 'Produk ditambahkan ke keranjang.' }
}

/** BUYER updates an item's quantity. */
export async function updateCartItemAction(
  _state: CartActionState | undefined,
  formData: FormData
): Promise<CartActionState> {
  await requireUserOrThrow()

  const parsed = updateCartItemSchema.safeParse({
    itemId: formData.get('itemId')?.toString(),
    quantity: Number(formData.get('quantity')),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await updateCartItem(parsed.data.itemId, parsed.data.quantity)
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath('/cart')
  return { success: true }
}

/** BUYER removes an item from their cart. */
export async function removeCartItemAction(formData: FormData): Promise<void> {
  await requireUserOrThrow()

  const itemId = formData.get('itemId')?.toString()
  if (!itemId) {
    redirect('/cart')
  }

  try {
    await removeFromCart(itemId)
  } catch {
    // falls through; transient failure surfaces via revalidation
  }

  revalidatePath('/cart')
  redirect('/cart')
}

/** BUYER checks out the entire cart → order confirmation. */
export async function checkoutAction(formData: FormData): Promise<void> {
  await requireUserOrThrow()

  const voucherCode = formData.get('voucherCode')?.toString()
  const paymentMethod = formData.get('paymentMethod')?.toString() || 'BANK_TRANSFER'

  let orderId: string
  try {
    orderId = await placeOrder(voucherCode)
  } catch {
    redirect('/cart?error=checkout')
  }

  // Update payment method on the order (default is BANK_TRANSFER from DB)
  if (paymentMethod !== 'BANK_TRANSFER') {
    const supabase = await createClient()
    await supabase
      .from('orders')
      .update({ payment_method: paymentMethod } as never)
      .eq('id', orderId)
  }

  revalidatePath('/cart')
  revalidatePath('/account/orders')

  // For bank transfer, redirect to payment instruction page
  if (paymentMethod === 'BANK_TRANSFER') {
    redirect(`/orders/${orderId}/pay`)
  }

  redirect(`/orders/${orderId}`)
}
