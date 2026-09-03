'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requirePermission, requireUserOrThrow } from '@/lib/auth/dal'
import {
  shipOrderSchema,
  requestReturnSchema,
  respondReturnSchema,
  escalateDisputeSchema,
  resolveDisputeSchema,
} from '@/lib/validation/shipping'
import {
  confirmReceipt,
  escalateDispute,
  requestReturn,
  resolveDispute,
  respondReturn,
  shipOrder,
} from '@/services/shipping-service'

export interface ShippingActionState {
  errors?: Record<string, string[] | undefined>
  message?: string
  success?: boolean
}

/** SELLER marks an order shipped with tracking. */
export async function shipOrderAction(
  _state: ShippingActionState | undefined,
  formData: FormData
): Promise<ShippingActionState> {
  await requirePermission('MANAGE_STORE')

  const parsed = shipOrderSchema.safeParse({
    orderId: formData.get('orderId')?.toString(),
    carrier: formData.get('carrier')?.toString(),
    trackingNumber: formData.get('trackingNumber')?.toString(),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await shipOrder(
      parsed.data.orderId,
      parsed.data.carrier,
      parsed.data.trackingNumber
    )
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath(`/seller/orders/${parsed.data.orderId}`)
  revalidatePath('/seller/orders')
  return { success: true }
}

/** BUYER confirms receipt, completing the order. */
export async function confirmReceiptAction(formData: FormData): Promise<void> {
  await requireUserOrThrow()
  const orderId = formData.get('orderId')?.toString()
  if (!orderId) redirect('/orders')

  try {
    await confirmReceipt(orderId)
  } catch {
    redirect('/orders')
  }
  revalidatePath(`/orders/${orderId}`)
  redirect(`/orders/${orderId}`)
}

/** BUYER requests a return for a line. */
export async function requestReturnAction(
  _state: ShippingActionState | undefined,
  formData: FormData
): Promise<ShippingActionState> {
  await requireUserOrThrow()

  const parsed = requestReturnSchema.safeParse({
    orderId: formData.get('orderId')?.toString(),
    orderItemId: formData.get('orderItemId')?.toString(),
    reasonId: formData.get('reasonId')?.toString() || null,
    note: formData.get('note')?.toString(),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await requestReturn({
      orderId: parsed.data.orderId,
      orderItemId: parsed.data.orderItemId,
      reasonId: parsed.data.reasonId ?? null,
      note: parsed.data.note ?? '',
    })
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath(`/orders/${parsed.data.orderId}`)
  redirect(`/orders/${parsed.data.orderId}?returned=1`)
}

/** SELLER accepts or rejects a return. */
export async function respondReturnAction(formData: FormData): Promise<void> {
  await requirePermission('MANAGE_STORE')

  const parsed = respondReturnSchema.safeParse({
    returnId: formData.get('returnId')?.toString(),
    approve: formData.get('approve')?.toString(),
    note: formData.get('note')?.toString(),
  })
  if (!parsed.success) redirect('/seller/returns')

  try {
    await respondReturn(
      parsed.data.returnId,
      parsed.data.approve === 'true',
      parsed.data.note ?? ''
    )
  } catch {
    redirect('/seller/returns')
  }
  revalidatePath('/seller/returns')
  redirect('/seller/returns')
}

/** BUYER escalates a rejected return to an admin dispute. */
export async function escalateDisputeAction(
  _state: ShippingActionState | undefined,
  formData: FormData
): Promise<ShippingActionState> {
  await requireUserOrThrow()

  const parsed = escalateDisputeSchema.safeParse({
    returnId: formData.get('returnId')?.toString(),
    reason: formData.get('reason')?.toString(),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await escalateDispute(parsed.data.returnId, parsed.data.reason)
  } catch (error) {
    return { message: (error as Error).message }
  }
  return { success: true }
}

/** ADMIN resolves an open dispute. */
export async function resolveDisputeAction(formData: FormData): Promise<void> {
  await requirePermission('MANAGE_DISPUTES')

  const parsed = resolveDisputeSchema.safeParse({
    disputeId: formData.get('disputeId')?.toString(),
    approve: formData.get('approve')?.toString(),
    note: formData.get('note')?.toString(),
  })
  if (!parsed.success) redirect('/admin/disputes')

  try {
    await resolveDispute(
      parsed.data.disputeId,
      parsed.data.approve === 'true',
      parsed.data.note ?? ''
    )
  } catch {
    redirect('/admin/disputes')
  }
  revalidatePath('/admin/disputes')
  redirect('/admin/disputes')
}