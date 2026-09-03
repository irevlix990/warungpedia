import { describe, it, expect } from 'vitest'
import {
  payOrderSchema,
  requestWithdrawalSchema,
  withdrawalDecisionSchema,
} from '../payment'

describe('payOrder schema', () => {
  it('accepts a valid order payment', () => {
    const r = payOrderSchema.safeParse({
      orderId: '00000000-0000-4000-8000-000000000001',
      method: 'BANK_TRANSFER',
    })
    expect(r.success).toBe(true)
  })

  it('rejects invalid payment method', () => {
    const r = payOrderSchema.safeParse({
      orderId: '00000000-0000-4000-8000-000000000001',
      method: 'CASH',
    })
    expect(r.success).toBe(false)
  })
})

describe('requestWithdrawal schema', () => {
  it('accepts a valid withdrawal request', () => {
    const r = requestWithdrawalSchema.safeParse({
      amount: 100_000,
      bankName: 'BCA',
      bankAccountNumber: '1234567890',
      bankAccountName: 'Budi',
    })
    expect(r.success).toBe(true)
  })

  it('rejects zero/negative amounts', () => {
    expect(
      requestWithdrawalSchema.safeParse({
        amount: 0,
        bankName: 'BCA',
        bankAccountNumber: '123',
        bankAccountName: 'Budi',
      }).success
    ).toBe(false)
    expect(
      requestWithdrawalSchema.safeParse({
        amount: -5,
        bankName: 'BCA',
        bankAccountNumber: '123',
        bankAccountName: 'Budi',
      }).success
    ).toBe(false)
  })

  it('rejects non-numeric account numbers', () => {
    const r = requestWithdrawalSchema.safeParse({
      amount: 100,
      bankName: 'BCA',
      bankAccountNumber: 'abc123',
      bankAccountName: 'Budi',
    })
    expect(r.success).toBe(false)
  })

  it('rejects float amounts', () => {
    const r = requestWithdrawalSchema.safeParse({
      amount: 100.5,
      bankName: 'BCA',
      bankAccountNumber: '123',
      bankAccountName: 'Budi',
    })
    expect(r.success).toBe(false)
  })
})

describe('withdrawalDecision schema', () => {
  it('accepts an approval (no reason)', () => {
    const r = withdrawalDecisionSchema.safeParse({
      withdrawalId: '00000000-0000-4000-8000-000000000001',
    })
    expect(r.success).toBe(true)
  })

  it('accepts a rejection with reason', () => {
    const r = withdrawalDecisionSchema.safeParse({
      withdrawalId: '00000000-0000-4000-8000-000000000001',
      reason: 'Data rekening tidak valid',
    })
    expect(r.success).toBe(true)
  })
})

