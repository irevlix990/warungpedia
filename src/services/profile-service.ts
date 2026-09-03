/**
 * Server-side profile & address service.
 *
 * All reads/writes run through the request-scoped Supabase client so Row
 * Level Security applies. Callers must first resolve the current user (via
 * the DAL) to know who is acting.
 */
import { createClient } from '@/lib/supabase/server'
import { NotFoundError, ValidationError } from '@/lib/errors'
import type { UpdateProfileInput } from '@/lib/validation/auth'
import type { AddressInput } from '@/lib/validation/address'

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName,
      phone: input.phone ?? null,
      preferred_locale: input.preferredLocale,
    })
    .eq('id', userId)
  if (error) throw new ValidationError(error.message)
}

export async function getAddresses(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw new ValidationError(error.message)
  return data ?? []
}

export async function createAddress(userId: string, input: AddressInput) {
  const supabase = await createClient()
  const { error } = await supabase.from('addresses').insert({
    user_id: userId,
    label: input.label,
    recipient_name: input.recipientName,
    phone: input.phone,
    street: input.street,
    district: input.district ?? null,
    city: input.city,
    province: input.province,
    postal_code: input.postalCode ?? null,
    country: input.country,
    is_default: input.isDefault,
  })
  if (error) throw new ValidationError(error.message)
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: AddressInput
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('addresses')
    .update({
      label: input.label,
      recipient_name: input.recipientName,
      phone: input.phone,
      street: input.street,
      district: input.district ?? null,
      city: input.city,
      province: input.province,
      postal_code: input.postalCode ?? null,
      country: input.country,
      is_default: input.isDefault,
    })
    .eq('id', addressId)
    .eq('user_id', userId)
  if (error) throw new ValidationError(error.message)
}

export async function deleteAddress(userId: string, addressId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()
  if (error) throw new ValidationError(error.message)
  if (!data) throw new NotFoundError('Alamat tidak ditemukan.')
}
