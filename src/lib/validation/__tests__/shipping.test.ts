import { describe, it, expect } from 'vitest'
import {
  shipOrderSchema,
  requestReturnSchema,
  respondReturnSchema,
  escalateDisputeSchema,
  resolveDisputeSchema,
} from '../shipping'

const UUID = '00000000-0000-4000-8000-000000000001'
const UUID2 = '00000000-0000-4000-8000-000000000002'

describe('shipOrder schema', () => {
  it('accepts a valid shipment', () => {
    const r = shipOrderSchema.safeParse({
      orderId: UUID,
      carrier: 'JNE',
      trackingNumber: 'JNE123456789',
    })
    expect(r.success).toBe(true)
  })

  it('rejects a missing tracking number', () => {
    const r = shipOrderSchema.safeParse({
      orderId: UUID,
      carrier: 'JNE',
      trackingNumber: '',
    })
    expect(r.success).toBe(false)
  })

  it('rejects an invalid order id', () => {
    const r = shipOrderSchema.safeParse({
      orderId: 'not-a-uuid',
      carrier: 'JNE',
      trackingNumber: 'ABC1234',
    })
    expect(r.success).toBe(false)
  })
})

describe('requestReturn schema', () => {
  it('accepts a valid return request', () => {
    const r = requestReturnSchema.safeParse({
      orderId: UUID,
      orderItemId: UUID2,
      reasonId: UUID,
      note: 'Barang rusak',
    })
    expect(r.success).toBe(true)
  })

  it('accepts an optional reason and note', () => {
    const r = requestReturnSchema.safeParse({
      orderId: UUID,
      orderItemId: UUID2,
    })
    expect(r.success).toBe(true)
  })

  it('rejects an invalid order item id', () => {
    const r = requestReturnSchema.safeParse({
      orderId: UUID,
      orderItemId: 'nope',
    })
    expect(r.success).toBe(false)
  })
})

describe('respondReturn schema', () => {
  it('accepts approve / reject booleans-as-strings', () => {
    expect(
      respondReturnSchema.safeParse({ returnId: UUID, approve: 'true' }).success
    ).toBe(true)
    expect(
      respondReturnSchema.safeParse({ returnId: UUID, approve: 'false' }).success
    ).toBe(true)
  })

  it('rejects a non-boolean approve value', () => {
    const r = respondReturnSchema.safeParse({
      returnId: UUID,
      approve: 'maybe',
    })
    expect(r.success).toBe(false)
  })
})

describe('escalateDispute schema', () => {
  it('accepts a valid escalation', () => {
    const r = escalateDisputeSchema.safeParse({
      returnId: UUID,
      reason: 'Seller menolak pengembalian',
    })
    expect(r.success).toBe(true)
  })

  it('rejects an empty reason', () => {
    const r = escalateDisputeSchema.safeParse({ returnId: UUID, reason: '' })
    expect(r.success).toBe(false)
  })
})

describe('resolveDispute schema', () => {
  it('accepts a valid resolution', () => {
    const r = resolveDisputeSchema.safeParse({
      disputeId: UUID,
      approve: 'true',
      note: 'Refund disetujui',
    })
    expect(r.success).toBe(true)
  })

  it('accepts a rejection with note', () => {
    const r = resolveDisputeSchema.safeParse({
      disputeId: UUID,
      approve: 'false',
      note: 'Klaim tidak valid',
    })
    expect(r.success).toBe(true)
  })
})