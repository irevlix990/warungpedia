export const RETURN_STATUSES = [
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'REFUNDED',
  'CANCELLED',
] as const
export type ReturnStatus = (typeof RETURN_STATUSES)[number]

export const DISPUTE_STATUSES = ['OPEN', 'APPROVED', 'REJECTED', 'CLOSED'] as const
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number]

/** A marketplace return reason (dropdown option). */
export interface ReturnReason {
  id: string
  code: string
  label: string
}

/** Shipment/tracking for an order. */
export interface Shipment {
  id: string
  orderId: string
  carrier: string
  trackingNumber: string
  shippedAt: string
}

/** A buyer return request on a single order line. */
export interface Return {
  id: string
  orderId: string
  orderItemId: string
  userId: string
  reasonId: string | null
  note: string
  status: ReturnStatus
  refundAmount: number | null
  sellerNote: string | null
  reviewedAt: string | null
  createdAt: string
}

/** An admin-resolved escalation of a rejected return. */
export interface Dispute {
  id: string
  returnId: string
  orderId: string
  userId: string
  sellerId: string
  reason: string
  status: DisputeStatus
  resolution: string | null
  decidedAt: string | null
  createdAt: string
}