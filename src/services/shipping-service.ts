import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import type { Order, OrderItem } from '@/types/cart'
import type {
  Dispute,
  Return,
  ReturnReason,
  Shipment,
} from '@/types/shipping'

type ReturnRow = Database['public']['Tables']['returns']['Row']
type ShipmentRow = Database['public']['Tables']['shipments']['Row']
type DisputeRow = Database['public']['Tables']['disputes']['Row']

function mapReturn(row: ReturnRow): Return {
  return {
    id: row.id,
    orderId: row.order_id,
    orderItemId: row.order_item_id,
    userId: row.user_id,
    reasonId: row.reason_id,
    note: row.note,
    status: row.status,
    refundAmount: row.refund_amount,
    sellerNote: row.seller_note,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  }
}

function mapShipment(row: ShipmentRow): Shipment {
  return {
    id: row.id,
    orderId: row.order_id,
    carrier: row.carrier,
    trackingNumber: row.tracking_number,
    shippedAt: row.shipped_at,
  }
}

function mapDispute(row: DisputeRow): Dispute {
  return {
    id: row.id,
    returnId: row.return_id,
    orderId: row.order_id,
    userId: row.user_id,
    sellerId: row.seller_id,
    reason: row.reason,
    status: row.status,
    resolution: row.resolution,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
  }
}

function mapOrderItem(
  row: Database['public']['Tables']['order_items']['Row']
): OrderItem {
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
 * Shipping, returns & disputes service — server-authoritative.
 * All money/status transitions route through security-definer functions;
 * reads are RLS-scoped to the acting user / item owner / admin.
 */

/** Active return reasons (dropdown). */
export const getReturnReasons = cache(
  async (): Promise<ReturnReason[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('return_reasons')
      .select('id, code, label')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (error) {
      throw new Error('Gagal memuat alasan pengembalian.')
    }
    return (data ?? []).map((r) => ({
      id: r.id,
      code: r.code,
      label: r.label,
    }))
  }
)

/** Shipment for an order, if any. */
export const getShipmentForOrder = cache(
  async (orderId: string): Promise<Shipment | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle()
    if (error) {
      throw new Error('Gagal memuat pengiriman.')
    }
    return data ? mapShipment(data) : null
  }
)

/** Returns for an order (RLS-scoped to the buyer). */
export const getReturnsForOrder = cache(
  async (orderId: string): Promise<Return[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
    if (error) {
      throw new Error('Gagal memuat pengembalian.')
    }
    return (data ?? []).map(mapReturn)
  }
)

/** Returns for the acting seller's stores, newest first. */
export const getReturnsForSeller = cache(
  async (): Promise<Return[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      throw new Error('Gagal memuat permintaan pengembalian.')
    }
    return (data ?? []).map(mapReturn)
  }
)

/** Open disputes for the admin queue. */
export async function getDisputesByStatus(
  status?: Dispute['status']
): Promise<Dispute[]> {
  const supabase = await createClient()
  let q = supabase.from('disputes').select('*')
  if (status) q = q.eq('status', status)
  const { data, error } = await q.order('created_at', { ascending: true })
  if (error) {
    throw new Error('Gagal memuat daftar sengketa.')
  }
  return (data ?? []).map(mapDispute)
}

/** A single order the seller owns at least one line of, with items. */
export const getSellerOrder = cache(
  async (orderId: string): Promise<Order | null> => {
    const supabase = await createClient()
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()
    if (error || !order) return null

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
    if (itemsError) return null

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

/** Orders across the acting seller's stores, latest first. */
export const getSellerOrders = cache(async (): Promise<Order[]> => {
  const supabase = await createClient()
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) {
    throw new Error('Gagal memuat pesanan penjual.')
  }

  const result: Order[] = []
  for (const order of orders ?? []) {
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true })
    if (itemsError) continue
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

/** Seller marks an order shipped with tracking. Returns the shipment id. */
export async function shipOrder(
  orderId: string,
  carrier: string,
  trackingNumber: string
): Promise<string> {
  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc('ship_order', {
    p_order_id: orderId,
    p_carrier: carrier,
    p_tracking: trackingNumber,
  })
  if (error) {
    throw new Error(mapShippingError(error.code, error.message))
  }
  if (!id) {
    throw new Error('Gagal mengirim pesanan.')
  }
  return id
}

/** Buyer confirms receipt, completing the order. */
export async function confirmReceipt(orderId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('confirm_receipt', {
    p_order_id: orderId,
  })
  if (error) {
    throw new Error(mapShippingError(error.code, error.message))
  }
}

/** Buyer requests a return for a line. Returns the return id. */
export async function requestReturn(input: {
  orderId: string
  orderItemId: string
  reasonId: string | null
  note: string
}): Promise<string> {
  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc('request_return', {
    p_order_id: input.orderId,
    p_order_item_id: input.orderItemId,
    p_reason_id: input.reasonId,
    p_note: input.note,
  })
  if (error) {
    throw new Error(mapShippingError(error.code, error.message))
  }
  if (!id) {
    throw new Error('Gagal mengajukan pengembalian.')
  }
  return id
}

/** Seller accepts/rejects a return (accepting refunds the line). */
export async function respondReturn(
  returnId: string,
  approve: boolean,
  note: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('respond_return', {
    p_return_id: returnId,
    p_approve: approve,
    p_note: note,
  })
  if (error) {
    throw new Error(mapShippingError(error.code, error.message))
  }
}

/** Buyer escalates a rejected return to a dispute. */
export async function escalateDispute(
  returnId: string,
  reason: string
): Promise<string> {
  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc('escalate_dispute', {
    p_return_id: returnId,
    p_reason: reason,
  })
  if (error) {
    throw new Error(mapShippingError(error.code, error.message))
  }
  if (!id) {
    throw new Error('Gagal mengajukan sengketa.')
  }
  return id
}

/** Admin resolves an open dispute (approving refunds the line). */
export async function resolveDispute(
  disputeId: string,
  approve: boolean,
  note: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('resolve_dispute', {
    p_dispute_id: disputeId,
    p_approve: approve,
    p_note: note,
  })
  if (error) {
    throw new Error(mapShippingError(error.code, error.message))
  }
}

/** Maps common Postgres/RLS errors to friendly, user-safe messages. */
function mapShippingError(code: string | null, message: string): string {
  switch (code) {
    case 'P0002':
      return message
    case '23514':
      return message
    case '23505':
      return 'Pengajuan sudah ada untuk baris ini.'
    case '42501':
      return 'Anda tidak memiliki izin untuk melakukan tindakan ini.'
    default:
      return 'Gagal memproses permintaan.'
  }
}