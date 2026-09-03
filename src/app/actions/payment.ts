'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  requirePermission,
  requireUserOrThrow,
} from '@/lib/auth/dal'
import {
  payOrderSchema,
  requestWithdrawalSchema,
  withdrawalDecisionSchema,
} from '@/lib/validation/payment'
import {
  approveWithdrawal,
  payOrder,
  rejectWithdrawal,
  requestWithdrawal,
} from '@/services/payment-service'

export interface PaymentActionState {
  errors?: Record<string, string[] | undefined>
  message?: string
  success?: boolean
}

/** BUYER pays for their PENDING order and redirects to the order page. */
export async function payOrderAction(
  _state: PaymentActionState | undefined,
  formData: FormData
): Promise<PaymentActionState> {
  await requireUserOrThrow()

  const parsed = payOrderSchema.safeParse({
    orderId: formData.get('orderId')?.toString(),
    method: formData.get('method')?.toString(),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await payOrder(parsed.data.orderId, parsed.data.method)
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath(`/orders/${parsed.data.orderId}`)
  redirect(`/orders/${parsed.data.orderId}?paid=1`)
}

/** SELLER requests a payout from their wallet balance. */
export async function requestWithdrawalAction(
  _state: PaymentActionState | undefined,
  formData: FormData
): Promise<PaymentActionState> {
  await requirePermission('MANAGE_STORE')

  const parsed = requestWithdrawalSchema.safeParse({
    amount: Number(formData.get('amount')),
    bankName: formData.get('bankName')?.toString(),
    bankAccountNumber: formData.get('bankAccountNumber')?.toString(),
    bankAccountName: formData.get('bankAccountName')?.toString(),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await requestWithdrawal(parsed.data)
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath('/seller/finances')
  redirect('/seller/finances?requested=1')
}

/** ADMIN approves a pending withdrawal. */
export async function approveWithdrawalAction(formData: FormData): Promise<void> {
  await requirePermission('MANAGE_WITHDRAWALS')

  const parsed = withdrawalDecisionSchema.safeParse({
    withdrawalId: formData.get('withdrawalId')?.toString(),
  })
  if (!parsed.success) {
    redirect('/admin/withdrawals')
  }

  try {
    await approveWithdrawal(parsed.data.withdrawalId)
  } catch {
    redirect('/admin/withdrawals')
  }

  revalidatePath('/admin/withdrawals')
  redirect('/admin/withdrawals')
}

/** ADMIN rejects a pending withdrawal, returning funds to the wallet. */
export async function rejectWithdrawalAction(
  _state: PaymentActionState | undefined,
  formData: FormData
): Promise<PaymentActionState> {
  await requirePermission('MANAGE_WITHDRAWALS')

  const parsed = withdrawalDecisionSchema.safeParse({
    withdrawalId: formData.get('withdrawalId')?.toString(),
    reason: formData.get('reason')?.toString(),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await rejectWithdrawal(
      parsed.data.withdrawalId,
      parsed.data.reason ?? ''
    )
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath('/admin/withdrawals')
  return { success: true }
}
