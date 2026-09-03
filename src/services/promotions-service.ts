import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, requireUserOrThrow } from '@/lib/auth/dal'
import type { Database } from '@/types/database'
import type {
  Voucher,
  VoucherInput,
  FlashSale,
  FlashSaleInput,
  VoucherValidationResult,
} from '@/types/promotions'

type VoucherRow = Database['public']['Tables']['vouchers']['Row']
type FlashSaleRow = Database['public']['Tables']['flash_sales']['Row']

function mapVoucher(row: VoucherRow): Voucher {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    minSpend: row.min_spend,
    maxDiscount: row.max_discount,
    perUserLimit: row.per_user_limit,
    totalUsageLimit: row.total_usage_limit,
    usesCount: row.uses_count,
    isActive: row.is_active,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapFlashSale(
  row: FlashSaleRow,
  productName?: string | null
): FlashSale {
  return {
    id: row.id,
    productId: row.product_id,
    productName: productName ?? null,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    isActive: row.is_active,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Admin: all vouchers, newest first. */
export async function getVouchers(): Promise<Voucher[]> {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    throw new Error('Gagal memuat daftar kupon.')
  }
  return (data ?? []).map(mapVoucher)
}

/** Admin: a single voucher by id. */
export const getVoucherById = cache(
  async (id: string): Promise<Voucher | null> => {
    await requireAdmin()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) {
      throw new Error('Gagal memuat kupon.')
    }
    return data ? mapVoucher(data) : null
  }
)

/** Admin: all flash sales (with product names), newest first. */
export async function getFlashSales(): Promise<FlashSale[]> {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('flash_sales')
    .select('*, products(name)')
    .order('created_at', { ascending: false })
  if (error) {
    throw new Error('Gagal memuat daftar flash sale.')
  }
  return (data ?? []).map((row) => {
    const name =
      (row.products as unknown as { name?: string } | null)?.name ?? null
    return mapFlashSale(row, name)
  })
}

/** Products available for selecting a flash sale (admin). */
export async function getProductsForFlashSale(): Promise<
  { id: string; name: string }[]
> {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, name')
    .order('name', { ascending: true })
    .limit(500)
  if (error) {
    throw new Error('Gagal memuat daftar produk.')
  }
  return (data ?? []).map((p) => ({ id: p.id, name: p.name }))
}

/** Public: active flash sales for a set of products (display overlay). */
export async function getActiveFlashSalesByProduct(
  productIds: string[]
): Promise<Map<string, { discountType: FlashSale['discountType']; discountValue: number }>> {
  if (productIds.length === 0) return new Map()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('flash_sales')
    .select('product_id, discount_type, discount_value, starts_at, ends_at')
    .in('product_id', productIds)
    .eq('is_active', true)
  if (error) {
    throw new Error('Gagal memuat promo produk.')
  }
  const now = Date.now()
  const map = new Map<
    string,
    { discountType: FlashSale['discountType']; discountValue: number }
  >()
  for (const row of data ?? []) {
    const starts = row.starts_at ? new Date(row.starts_at).getTime() : null
    const ends = row.ends_at ? new Date(row.ends_at).getTime() : null
    if (starts && starts > now) continue
    if (ends && ends <= now) continue
    // Pick the most favorable (lowest expected price) sale for the product.
    const existing = map.get(row.product_id)
    if (
      !existing ||
      existing.discountType !== row.discount_type ||
      existing.discountValue < row.discount_value
    ) {
      map.set(row.product_id, {
        discountType: row.discount_type,
        discountValue: row.discount_value,
      })
    }
  }
  return map
}

/** Admin: creates a voucher. Returns the new voucher id. */
export async function createVoucher(
  code: string,
  input: VoucherInput
): Promise<string> {
  await requireAdmin()
  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc('create_voucher', {
    p_code: code,
    p_description: input.description ?? null,
    p_discount_type: input.discountType,
    p_discount_value: input.discountValue,
    p_min_spend: input.minSpend ?? 0,
    p_max_discount: input.maxDiscount ?? null,
    p_per_user_limit: input.perUserLimit ?? 1,
    p_total_usage_limit: input.totalUsageLimit ?? null,
    p_is_active: input.isActive ?? true,
    p_starts_at: input.startsAt ?? null,
    p_expires_at: input.expiresAt ?? null,
  })
  if (error) throw new Error(mapPromoError(error.code, error.message))
  if (!id) throw new Error('Gagal menyimpan kupon.')
  return id
}

/** Admin: updates a voucher. */
export async function updateVoucher(
  id: string,
  input: VoucherInput
): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc('update_voucher', {
    p_id: id,
    p_description: input.description ?? null,
    p_discount_type: input.discountType,
    p_discount_value: input.discountValue,
    p_min_spend: input.minSpend ?? 0,
    p_max_discount: input.maxDiscount ?? null,
    p_per_user_limit: input.perUserLimit ?? 1,
    p_total_usage_limit: input.totalUsageLimit ?? null,
    p_is_active: input.isActive ?? true,
    p_starts_at: input.startsAt ?? null,
    p_expires_at: input.expiresAt ?? null,
  })
  if (error) throw new Error(mapPromoError(error.code, error.message))
}

/** Admin: toggles a voucher's active flag. */
export async function setVoucherActive(
  id: string,
  isActive: boolean
): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_voucher_active', {
    p_id: id,
    p_is_active: isActive,
  })
  if (error) throw new Error(mapPromoError(error.code, error.message))
}

/** Admin: creates a flash sale. */
export async function createFlashSale(
  productId: string,
  input: FlashSaleInput
): Promise<string> {
  await requireAdmin()
  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc('create_flash_sale', {
    p_product_id: productId,
    p_discount_type: input.discountType,
    p_discount_value: input.discountValue,
    p_is_active: input.isActive ?? true,
    p_starts_at: input.startsAt ?? null,
    p_ends_at: input.endsAt ?? null,
  })
  if (error) throw new Error(mapPromoError(error.code, error.message))
  if (!id) throw new Error('Gagal menyimpan flash sale.')
  return id
}

/** Admin: updates a flash sale. */
export async function updateFlashSale(
  id: string,
  input: FlashSaleInput
): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc('update_flash_sale', {
    p_id: id,
    p_discount_type: input.discountType,
    p_discount_value: input.discountValue,
    p_is_active: input.isActive ?? true,
    p_starts_at: input.startsAt ?? null,
    p_ends_at: input.endsAt ?? null,
  })
  if (error) throw new Error(mapPromoError(error.code, error.message))
}

/** Admin: toggles a flash sale's active flag. */
export async function setFlashSaleActive(
  id: string,
  isActive: boolean
): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_flash_sale_active', {
    p_id: id,
    p_is_active: isActive,
  })
  if (error) throw new Error(mapPromoError(error.code, error.message))
}

/**
 * Read-only validation of a voucher code against the acting user and a
 * subtotal. Used for a checkout preview; the authoritative application
 * happens inside `place_order`.
 */
export async function validateVoucher(
  code: string,
  subtotal: number
): Promise<VoucherValidationResult | null> {
  const user = await requireUserOrThrow()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('validate_voucher', {
    p_code: code,
    p_user_id: user.id,
    p_subtotal: subtotal,
  })
  if (error) {
    throw new Error(mapPromoError(error.code, error.message))
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return {
    voucherId: row.voucher_id,
    discount: row.discount,
    message: row.message,
  }
}

/** Maps common promotion/RLS errors to friendly messages. */
function mapPromoError(code: string | null, message: string): string {
  switch (code) {
    case 'P0002':
      return message
    case '23514':
      return message
    case '23505':
      return 'Kode kupon sudah digunakan Coba kode lain.'
    case '42501':
      return 'Anda tidak memiliki izin untuk melakukan tindakan ini.'
    default:
      return 'Gagal memproses promo.'
  }
}