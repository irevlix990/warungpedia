import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import type { Cart, CartItem, Order, OrderItem } from '@/types/cart'
import { computeSubtotal } from '@/utils/cart'
import { flashSalePrice } from '@/utils/promotions'
import { mapProduct } from './product-service'
import { getActiveFlashSalesByProduct } from './promotions-service'

type CartRow = Database['public']['Tables']['cart_items']['Row']

function mapOrderItem(row: Database['public']['Tables']['order_items']['Row']): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    storeId: row.store_id,
    productId: row.product_id,
    productName: row.product_name,
    productPrice: row.product_price,
    quantity: row.quantity,
    weightGrams: row.weight_grams,
    createdAt: row.created_at,
  }
}

/**
 * Cart & checkout service — server-authoritative cart/order logic.
 *
 * Cart mutations and checkout are routed through security-definer
 * PostgreSQL functions (`add_to_cart`, `update_cart_item`,
 * `remove_from_cart`, `place_order`) so purchasability, stock, ownership and
 * money are enforced centrally. Reads are RLS-scoped to the acting user.
 */

/** The acting user's cart joined with current product snapshots. */
export const getCartForUser = cache(async (): Promise<Cart> => {
  const supabase = await createClient()

  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .maybeSingle()
  if (cartError) {
    throw new Error('Gagal memuat keranjang.')
  }
  if (!cart) {
    return { items: [], itemCount: 0, subtotal: 0 }
  }

  const { data, error } = await supabase
    .from('cart_items')
    .select('id, quantity, product_id')
    .eq('cart_id', cart.id)
  if (error) {
    throw new Error('Gagal memuat keranjang.')
  }

  const rows = (data ?? []) as CartRow[]
  if (rows.length === 0) {
    return { items: [], itemCount: 0, subtotal: 0 }
  }

  const productIds = rows.map((r) => r.product_id)
  const { data: products, error: productError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('status', 'ACTIVE')
  if (productError) {
    throw new Error('Gagal memuat produk di keranjang.')
  }

  const productById = new Map((products ?? []).map((p) => [p.id, p]))
  const storeIds = [...new Set((products ?? []).map((p) => p.store_id))]

  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('id, slug')
    .in('id', storeIds)
  if (storesError) {
    throw new Error('Gagal memuat produk di keranjang.')
  }
  const storeSlugById = new Map(
    (stores ?? []).map((s) => [s.id, s.slug] as const)
  )

  const items: CartItem[] = []

  const activeFlash = await getActiveFlashSalesByProduct(productIds)

  for (const row of rows) {
    const product = productById.get(row.product_id)
    if (!product) continue
    const storeSlug = storeSlugById.get(row.product_id)
    if (!storeSlug) continue
    const mapped = mapProduct(product)
    const sale = activeFlash.get(row.product_id)
    if (sale) {
      // Overlay the best active flash-sale price for accurate cart display.
      mapped.price = flashSalePrice(mapped.price, sale)
    }
    items.push({
      id: row.id,
      quantity: row.quantity,
      storeSlug,
      product: mapped,
    })
  }

  return {
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: computeSubtotal(items),
  }
})

/** Adds an item to the user's cart via the definer function. */
export async function addToCart(
  productId: string,
  quantity: number
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('add_to_cart', {
    p_product_id: productId,
    p_quantity: quantity,
  })
  if (error) {
    throw new Error(mapCartError(error.code, error.message))
  }
}

/** Sets an item's quantity via the definer function. */
export async function updateCartItem(
  itemId: string,
  quantity: number
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('update_cart_item', {
    p_item_id: itemId,
    p_quantity: quantity,
  })
  if (error) {
    throw new Error(mapCartError(error.code, error.message))
  }
}

/** Removes an item from the user's cart. */
export async function removeFromCart(itemId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('remove_from_cart', {
    p_item_id: itemId,
  })
  if (error) {
    throw new Error(mapCartError(error.code, error.message))
  }
}

/**
 * Places an order from the entire cart via the definer transaction. An
 * optional voucher code is validated and applied server-side. Returns the new
 * order id; callers redirect to an order confirmation.
 */
export async function placeOrder(voucherCode?: string): Promise<string> {
  const supabase = await createClient()
  const { data: orderId, error } = await supabase.rpc('place_order', {
    p_voucher_code: voucherCode || null,
  })
  if (error) {
    throw new Error(mapCartError(error.code, error.message))
  }
  if (!orderId) {
    throw new Error('Gagal membuat pesanan.')
  }
  return orderId
}

/** A single order with its snapshot items (RLS-scoped to the buyer). */
export const getOrderById = cache(
  async (orderId: string): Promise<Order | null> => {
    const supabase = await createClient()

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()
    if (error) {
      throw new Error('Gagal memuat pesanan.')
    }
    if (!order) return null

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
    if (itemsError) {
      throw new Error('Gagal memuat pesanan.')
    }

    return {
      id: order.id,
      userId: order.user_id,
      status: order.status,
      subtotal: order.subtotal,
      shippingFee: order.shipping_fee,
      discount: order.discount,
      total: order.total,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: (items ?? []).map(mapOrderItem),
    }
  }
)

/** The acting user's orders, newest first, with their items. */
export const getOrdersForUser = cache(async (): Promise<Order[]> => {
  const supabase = await createClient()

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) {
    throw new Error('Gagal memuat daftar pesanan.')
  }

  const result: Order[] = []
  for (const order of orders ?? []) {
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true })
    if (itemsError) {
      throw new Error('Gagal memuat daftar pesanan.')
    }
    result.push({
      id: order.id,
      userId: order.user_id,
      status: order.status,
      subtotal: order.subtotal,
      shippingFee: order.shipping_fee,
      discount: order.discount,
      total: order.total,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: (items ?? []).map(mapOrderItem),
    })
  }

  return result
})

/** Maps common Postgres/RLS errors to friendly, user-safe messages. */
function mapCartError(code: string | null, message: string): string {
  switch (code) {
    case 'P0002':
      return message
    case '42501':
      return 'Anda tidak memiliki izin untuk melakukan tindakan ini.'
    case '23505':
      return 'Item sudah ada di keranjang.'
    default:
      return 'Gagal memproses keranjang.'
  }
}
