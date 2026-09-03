import type { Product } from './product'

export const ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** A line in the user's cart, joined with its current product snapshot. */
export interface CartItem {
  id: string
  quantity: number
  storeSlug: string
  product: Product
}

/** The acting user's cart: a list of line items plus its totals. */
export interface Cart {
  items: CartItem[]
  itemCount: number
  subtotal: number
}

/** A single order line, snapshot of the product at purchase time. */
export interface OrderItem {
  id: string
  orderId: string
  storeId: string
  productId: string | null
  productName: string
  productPrice: number
  quantity: number
  weightGrams: number | null
  createdAt: string
}

/** An order header plus its snapshot lines. */
export interface Order {
  id: string
  userId: string
  status: OrderStatus
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

/** Display-only constants derived from an order header (never for writes). */
export interface OrderTotals {
  subtotal: number
  subtotalLabel: string
  discount: number
  discountLabel: string
  shippingFee: number
  total: number
  totalLabel: string
}

/** Display-only constants derived from the integer subtotal (never used for writes). */
export interface CartTotals {
  subtotal: number
  subtotalLabel: string
  shippingFee: number
  total: number
  totalLabel: string
}
