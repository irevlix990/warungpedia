'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUserOrThrow } from '@/lib/auth/dal'
import {
  updateProfile,
  createAddress,
  updateAddress,
  deleteAddress,
} from '@/services/profile-service'
import { updatePassword } from '@/services/auth-service'
import { updateProfileSchema } from '@/lib/validation/auth'
import { addressSchema } from '@/lib/validation/address'
import { resetPasswordSchema } from '@/lib/validation/auth'

export interface ProfileFormState {
  errors?: Record<string, string[] | undefined>
  message?: string
  success?: boolean
}

export async function updateProfileAction(
  _state: ProfileFormState | undefined,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await requireUserOrThrow()

  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get('fullName'),
    phone: formData.get('phone') || null,
    preferredLocale: formData.get('preferredLocale') || 'id',
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await updateProfile(user.id, parsed.data)
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath('/account/profile')
  return { success: true, message: 'Profil berhasil diperbarui.' }
}

export async function updatePasswordAction(
  _state: ProfileFormState | undefined,
  formData: FormData
): Promise<ProfileFormState> {
  await requireUserOrThrow()

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await updatePassword(parsed.data.password)
  } catch (error) {
    return { message: (error as Error).message }
  }

  return { success: true, message: 'Kata sandi berhasil diperbarui.' }
}

export async function addAddressAction(
  _state: ProfileFormState | undefined,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await requireUserOrThrow()

  const parsed = addressSchema.safeParse({
    label: formData.get('label') || 'Alamat',
    recipientName: formData.get('recipientName'),
    phone: formData.get('phone'),
    street: formData.get('street'),
    district: formData.get('district') || null,
    city: formData.get('city'),
    province: formData.get('province'),
    postalCode: formData.get('postalCode') || null,
    country: formData.get('country') || 'Indonesia',
    isDefault: formData.get('isDefault') === 'on',
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await createAddress(user.id, parsed.data)
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath('/account/addresses')
  return { success: true, message: 'Alamat berhasil ditambahkan.' }
}

export async function editAddressAction(
  _state: ProfileFormState | undefined,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await requireUserOrThrow()
  const addressId = formData.get('addressId')?.toString()

  const parsed = addressSchema.safeParse({
    label: formData.get('label') || 'Alamat',
    recipientName: formData.get('recipientName'),
    phone: formData.get('phone'),
    street: formData.get('street'),
    district: formData.get('district') || null,
    city: formData.get('city'),
    province: formData.get('province'),
    postalCode: formData.get('postalCode') || null,
    country: formData.get('country') || 'Indonesia',
    isDefault: formData.get('isDefault') === 'on',
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  if (!addressId) {
    return { message: 'ID alamat tidak valid.' }
  }

  try {
    await updateAddress(user.id, addressId, parsed.data)
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath('/account/addresses')
  return { success: true, message: 'Alamat berhasil diperbarui.' }
}

export async function removeAddressAction(
  formData: FormData
): Promise<void> {
  const user = await requireUserOrThrow()
  const addressId = formData.get('addressId')?.toString()
  if (!addressId) return
  await deleteAddress(user.id, addressId)
  revalidatePath('/account/addresses')
  redirect('/account/addresses')
}
