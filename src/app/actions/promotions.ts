'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requirePermission, requireUserOrThrow } from '@/lib/auth/dal'
import {
  flashSaleInputSchema,
  voucherApplySchema,
  voucherInputSchema,
} from '@/lib/validation/promotions'
import {
  createFlashSale,
  createVoucher,
  setFlashSaleActive,
  setVoucherActive,
  updateFlashSale,
  updateVoucher,
  validateVoucher,
} from '@/services/promotions-service'

export interface PromoActionState {
  errors?: Record<string, string[] | undefined>
  message?: string
  success?: boolean
  discount?: number
}

/** Converts a `datetime-local` value (naive) to UTC ISO, or null when empty. */
function toUtcIso(value: FormDataEntryValue | null): string | null {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return null
  return `${raw}Z`
}

/** ADMIN: creates a voucher. */
export async function createVoucherAction(
  _state: PromoActionState | undefined,
  formData: FormData
): Promise<PromoActionState> {
  await requirePermission('MANAGE_VOUCHERS')

  const parsed = voucherInputSchema.safeParse({
    description: formData.get('description')?.toString() || null,
    discountType: formData.get('discountType')?.toString(),
    discountValue: Number(formData.get('discountValue')),
    minSpend: Number(formData.get('minSpend') ?? 0),
    maxDiscount: formData.get('maxDiscount')
      ? Number(formData.get('maxDiscount'))
      : null,
    perUserLimit: Number(formData.get('perUserLimit') ?? 1),
    totalUsageLimit: formData.get('totalUsageLimit')
      ? Number(formData.get('totalUsageLimit'))
      : null,
    isActive: formData.get('isActive') === 'on',
    startsAt: toUtcIso(formData.get('startsAt')),
    expiresAt: toUtcIso(formData.get('expiresAt')),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const code = (formData.get('code')?.toString() ?? '').trim().toUpperCase()

  try {
    await createVoucher(code, parsed.data)
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath('/admin/vouchers')
  return { success: true }
}

/** ADMIN: updates a voucher. */
export async function updateVoucherAction(
  _state: PromoActionState | undefined,
  formData: FormData
): Promise<PromoActionState> {
  await requirePermission('MANAGE_VOUCHERS')

  const voucherId = formData.get('voucherId')?.toString() ?? ''
  const parsed = voucherInputSchema.safeParse({
    description: formData.get('description')?.toString() || null,
    discountType: formData.get('discountType')?.toString(),
    discountValue: Number(formData.get('discountValue')),
    minSpend: Number(formData.get('minSpend') ?? 0),
    maxDiscount: formData.get('maxDiscount')
      ? Number(formData.get('maxDiscount'))
      : null,
    perUserLimit: Number(formData.get('perUserLimit') ?? 1),
    totalUsageLimit: formData.get('totalUsageLimit')
      ? Number(formData.get('totalUsageLimit'))
      : null,
    isActive: formData.get('isActive') === 'on',
    startsAt: toUtcIso(formData.get('startsAt')),
    expiresAt: toUtcIso(formData.get('expiresAt')),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await updateVoucher(voucherId, parsed.data)
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath('/admin/vouchers')
  return { success: true }
}

/** ADMIN: toggles a voucher's active flag (redirects back). */
export async function setVoucherActiveAction(formData: FormData): Promise<void> {
  await requirePermission('MANAGE_VOUCHERS')
  const id = formData.get('voucherId')?.toString()
  const isActive = formData.get('isActive') === 'on'
  if (!id) redirect('/admin/vouchers')
  try {
    await setVoucherActive(id, isActive)
  } catch {
    redirect('/admin/vouchers')
  }
  revalidatePath('/admin/vouchers')
  redirect('/admin/vouchers')
}

/** ADMIN: creates a flash sale. */
export async function createFlashSaleAction(
  _state: PromoActionState | undefined,
  formData: FormData
): Promise<PromoActionState> {
  await requirePermission('MANAGE_FLASH_SALES')

  const productId = formData.get('productId')?.toString() ?? ''
  const parsed = flashSaleInputSchema.safeParse({
    discountType: formData.get('discountType')?.toString(),
    discountValue: Number(formData.get('discountValue')),
    isActive: formData.get('isActive') === 'on',
    startsAt: toUtcIso(formData.get('startsAt')),
    endsAt: toUtcIso(formData.get('endsAt')),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await createFlashSale(productId, parsed.data)
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath('/admin/flash-sales')
  return { success: true }
}

/** ADMIN: updates a flash sale. */
export async function updateFlashSaleAction(
  _state: PromoActionState | undefined,
  formData: FormData
): Promise<PromoActionState> {
  await requirePermission('MANAGE_FLASH_SALES')

  const saleId = formData.get('flashSaleId')?.toString() ?? ''
  const parsed = flashSaleInputSchema.safeParse({
    discountType: formData.get('discountType')?.toString(),
    discountValue: Number(formData.get('discountValue')),
    isActive: formData.get('isActive') === 'on',
    startsAt: toUtcIso(formData.get('startsAt')),
    endsAt: toUtcIso(formData.get('endsAt')),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await updateFlashSale(saleId, parsed.data)
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath('/admin/flash-sales')
  return { success: true }
}

/** ADMIN: toggles a flash sale's active flag (redirects back). */
export async function setFlashSaleActiveAction(
  formData: FormData
): Promise<void> {
  await requirePermission('MANAGE_FLASH_SALES')
  const id = formData.get('flashSaleId')?.toString()
  const isActive = formData.get('isActive') === 'on'
  if (!id) redirect('/admin/flash-sales')
  try {
    await setFlashSaleActive(id, isActive)
  } catch {
    redirect('/admin/flash-sales')
  }
  revalidatePath('/admin/flash-sales')
  redirect('/admin/flash-sales')
}

/**
 * BUYER: read-only preview of a voucher code against the current cart
 * subtotal. Display only — the authoritative application happens in
 * `place_order` at checkout.
 */
export async function applyVoucherPreviewAction(
  _state: PromoActionState | undefined,
  formData: FormData
): Promise<PromoActionState> {
  await requireUserOrThrow()
  const parsed = voucherApplySchema.safeParse({
    voucherCode: formData.get('voucherCode')?.toString() ?? '',
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const subtotal = Number(formData.get('subtotal') ?? 0)

  try {
    const result = await validateVoucher(parsed.data.voucherCode, subtotal)
    if (!result?.voucherId) {
      return { message: result?.message ?? 'Kode kupon tidak valid.' }
    }
    return { success: true, discount: result.discount }
  } catch (error) {
    return { message: (error as Error).message }
  }
}