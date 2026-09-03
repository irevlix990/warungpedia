'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  requirePermission,
  requireUserOrThrow,
} from '@/lib/auth/dal'
import { storeSchema } from '@/lib/validation/store'
import {
  approveStore,
  createStoreApplication,
  getStoreByOwner,
  rejectStore,
  resubmitStoreApplication,
  updateStoreDetails,
} from '@/services/store-service'
import { purgeStoreCache } from '@/config/cache-tags'

export interface StoreFormState {
  errors?: Record<string, string[] | undefined>
  message?: string
  success?: boolean
}

/** BUYER opens a new store application (created as PENDING). */
export async function applyStoreAction(
  _state: StoreFormState | undefined,
  formData: FormData
): Promise<StoreFormState> {
  const user = await requireUserOrThrow()

  if (user.role !== 'BUYER') {
    return { message: 'Hanya pembeli yang dapat mengajukan toko.' }
  }

  const existing = await getStoreByOwner(user.id).catch(() => null)
  if (existing) {
    redirect('/seller/status')
  }

  const parsed = storeSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    tagline: formData.get('tagline') || '',
    description: formData.get('description') || '',
    contactEmail: formData.get('contactEmail'),
    phone: formData.get('phone') || '',
    province: formData.get('province'),
    city: formData.get('city'),
    logoUrl: formData.get('logoUrl') || '',
    bannerUrl: formData.get('bannerUrl') || '',
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await createStoreApplication(user.id, parsed.data)
  } catch (error) {
    return { message: (error as Error).message }
  }

  redirect('/seller/status')
}

/** SELLER updates their own ACTIVE store details. */
export async function updateStoreAction(
  _state: StoreFormState | undefined,
  formData: FormData
): Promise<StoreFormState> {
  const user = await requirePermission('MANAGE_STORE')
  const store = await getStoreByOwner(user.id).catch(() => null)
  if (!store || store.status !== 'ACTIVE') {
    return { message: 'Toko belum aktif.' }
  }

  const parsed = storeSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    tagline: formData.get('tagline') || '',
    description: formData.get('description') || '',
    contactEmail: formData.get('contactEmail'),
    phone: formData.get('phone') || '',
    province: formData.get('province'),
    city: formData.get('city'),
    logoUrl: formData.get('logoUrl') || '',
    bannerUrl: formData.get('bannerUrl') || '',
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await updateStoreDetails(store.id, user.id, parsed.data)
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath('/seller/store')
  revalidatePath(`/store/${store.slug}`)
  purgeStoreCache()
  return { success: true, message: 'Pengaturan toko berhasil diperbarui.' }
}

/** SELLER resubmits a rejected application. */
export async function resubmitStoreAction(formData: FormData): Promise<void> {
  const user = await requireUserOrThrow()
  const storeId = formData.get('storeId')?.toString()

  const store = await getStoreByOwner(user.id).catch(() => null)
  if (!store || store.id !== storeId) {
    redirect('/seller/apply')
  }
  if (store.status !== 'REJECTED') {
    redirect('/seller/status')
  }

  await resubmitStoreApplication(store.id).catch(() => null)
  revalidatePath('/seller/status')
  purgeStoreCache()
  redirect('/seller/status')
}

/** ADMIN approves or rejects a pending store application. */
export async function reviewStoreAction(
  _state: StoreFormState | undefined,
  formData: FormData
): Promise<StoreFormState> {
  await requirePermission('VERIFY_SELLERS')

  const storeId = formData.get('storeId')?.toString()
  const decision = formData.get('decision')?.toString()
  const reason = (formData.get('reason')?.toString() ?? '').trim()

  if (!storeId) {
    return { message: 'ID toko tidak valid.' }
  }

  try {
    if (decision === 'approve') {
      await approveStore(storeId)
    } else if (decision === 'reject') {
      if (reason.length < 5) {
        return { message: 'Alasan penolakan minimal 5 karakter.' }
      }
      await rejectStore(storeId, reason)
    } else {
      return { message: 'Keputusan tidak valid.' }
    }
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath('/admin/stores')
  purgeStoreCache()
  return {
    success: true,
    message: decision === 'approve' ? 'Toko disetujui.' : 'Toko ditolak.',
  }
}