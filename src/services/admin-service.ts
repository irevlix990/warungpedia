import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import {
  requirePermission,
  requireSuperAdmin,
} from '@/lib/auth/dal'
import type { Role } from '@/config/roles'
import type { Database } from '@/types/database'
import type { Category } from '@/types/catalog'
import type { ProductReview } from '@/types/social'
import type {
  AdminStats,
  AdminUser,
  AdminProduct,
  ProductModerationInput,
  ProductModerationStatus,
  AdminOrder,
  OrderStatus,
  CategoryInput,
} from '@/types/admin'

type ProductRow = Database['public']['Tables']['products']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']
type ReviewRow = Database['public']['Tables']['product_reviews']['Row']
type SettingInsert = Database['public']['Tables']['settings']['Insert']

interface DbUserRow {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  role: string
  email_verified: boolean | null
  created_at: string
  updated_at: string
}

/** Admin dashboard aggregate KPIs. */
export async function getAdminStats(): Promise<AdminStats> {
  await requirePermission('VIEW_ANALYTICS')
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_dashboard_stats')
  if (error) {
    throw new Error(`Gagal memuat statistik: ${error.message}`)
  }
  // `returns table(...)` RPCs are returned as an array at runtime even though
  // they are typed as a single row — normalize both shapes before reading.
  const row = Array.isArray(data) ? (data[0] ?? null) : (data ?? null)
  return {
    totalUsers: row?.total_users ?? 0,
    totalBuyers: row?.total_buyers ?? 0,
    totalSellers: row?.total_sellers ?? 0,
    totalAdmins: row?.total_admins ?? 0,
    totalStores: row?.total_stores ?? 0,
    pendingStores: row?.pending_stores ?? 0,
    activeStores: row?.active_stores ?? 0,
    totalProducts: row?.total_products ?? 0,
    activeProducts: row?.active_products ?? 0,
    totalOrders: row?.total_orders ?? 0,
    committedOrders: row?.committed_orders ?? 0,
    gmv: row?.gmv ?? 0,
    pendingWithdrawals: row?.pending_withdrawals ?? 0,
    pendingWithdrawalsValue: row?.pending_withdrawals_value ?? 0,
    openDisputes: row?.open_disputes ?? 0,
    pendingReturns: row?.pending_returns ?? 0,
    hiddenReviews: row?.hidden_reviews ?? 0,
  }
}

/** Admin: all users (emails joined from auth.users). */
export async function getAdminUsers(): Promise<AdminUser[]> {
  await requirePermission('MANAGE_USERS')
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) {
    throw new Error(`Gagal memuat pengguna: ${error.message}`)
  }
  const rows = (data as unknown as DbUserRow[] | null) ?? []
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    role: (row.role as Role) ?? 'BUYER',
    emailVerified: row.email_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

/** Super-admin: change a user's role. */
export async function setAdminUserRole(
  userId: string,
  role: Role
): Promise<void> {
  await requireSuperAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_set_user_role', {
    p_user_id: userId,
    p_role: role,
  })
  if (error) {
    throw new Error(mapAdminError(error.code, 'Gagal mengubah peran pengguna.'))
  }
}

// ---------------------------------------------------------------------------
// Product moderation
// ---------------------------------------------------------------------------

function mapAdminProduct(
  row: ProductRow & {
    stores?: { name?: string | null } | null
    categories?: { name?: string | null } | null
  }
): AdminProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    storeId: row.store_id,
    storeName: row.stores?.name ?? null,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? null,
    price: row.price,
    stock: row.stock,
    status: row.status,
    isFeatured: row.is_featured,
    ratingAvg: row.rating_avg,
    reviewsCount: row.reviews_count,
    createdAt: row.created_at,
  }
}

/** Admin: products for moderation, optional status + term filter. */
export async function getAdminProducts(
  status?: ProductModerationStatus,
  term?: string
): Promise<AdminProduct[]> {
  await requirePermission('MODERATE_PRODUCTS')
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('*, stores(name), categories(name)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (status) {
    query = query.eq('status', status)
  }
  if (term && term.trim()) {
    query = query.ilike('name', `%${term.trim()}%`)
  }
  const { data, error } = await query
  if (error) {
    throw new Error(`Gagal memuat produk: ${error.message}`)
  }
  return (data ?? []).map(mapAdminProduct)
}

/** Admin: moderate a product's status and/or featured flag. */
export async function moderateProduct(
  productId: string,
  input: ProductModerationInput
): Promise<void> {
  await requirePermission('MODERATE_PRODUCTS')
  const supabase = await createClient()
  const patch: Partial<
    Pick<ProductRow, 'status' | 'is_featured'>
  > = {}
  if (input.status) patch.status = input.status
  if (input.featured !== undefined) patch.is_featured = input.featured
  if (Object.keys(patch).length === 0) return

  const { error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', productId)
  if (error) {
    throw new Error(mapAdminError(error.code, 'Gagal memoderasi produk.'))
  }
}

// ---------------------------------------------------------------------------
// Order management
// ---------------------------------------------------------------------------

/** Admin: orders for management, optional status filter. */
export async function getAdminOrders(
  status?: OrderStatus
): Promise<AdminOrder[]> {
  await requirePermission('MANAGE_ORDERS')
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('id, user_id, status, subtotal, shipping_fee, discount, total, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (status) {
    query = query.eq('status', status)
  }
  const { data: orders, error } = await query
  if (error) {
    throw new Error(`Gagal memuat pesanan: ${error.message}`)
  }

  const ids = (orders ?? []).map((o) => o.user_id)
  const names = new Map<string, string | null>()
  if (ids.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', ids)
    if (!profileError && profiles) {
      for (const p of profiles) names.set(p.id, p.full_name)
    }
  }

  const orderIds = (orders ?? []).map((o) => o.id)
  const counts = new Map<string, number>()
  if (orderIds.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('order_id, id')
      .in('order_id', orderIds)
    if (!itemsError && items) {
      for (const it of items) {
        counts.set(it.order_id, (counts.get(it.order_id) ?? 0) + 1)
      }
    }
  }

  return (orders ?? []).map((o) => ({
    id: o.id,
    userId: o.user_id,
    buyerName: names.get(o.user_id) ?? null,
    status: o.status as OrderStatus,
    subtotal: o.subtotal,
    shippingFee: o.shipping_fee,
    discount: o.discount,
    total: o.total,
    itemCount: counts.get(o.id) ?? 0,
    createdAt: o.created_at,
  }))
}

// ---------------------------------------------------------------------------
// Review moderation
// ---------------------------------------------------------------------------

/** Admin: all reviews (all statuses), newest first. */
export async function getAdminReviews(
  status?: 'ACTIVE' | 'HIDDEN'
): Promise<(ProductReview & { productName: string | null })[]> {
  await requirePermission('MODERATE_PRODUCTS')
  const supabase = await createClient()
  let query = supabase
    .from('product_reviews')
    .select('*, products(name)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (status) {
    query = query.eq('status', status)
  }
  const { data, error } = await query
  if (error) {
    throw new Error(`Gagal memuat ulasan: ${error.message}`)
  }
  return (data ?? []).map((row: ReviewRow & { products?: { name?: string | null } | null }) => {
    const productName = row.products?.name ?? null
    return {
      id: row.id,
      productId: row.product_id,
      storeId: row.store_id,
      userId: row.user_id,
      orderId: row.order_id,
      authorName: row.author_name,
      rating: row.rating,
      title: row.title,
      body: row.body,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      productName,
    }
  })
}

// ---------------------------------------------------------------------------
// Category management
// ---------------------------------------------------------------------------

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    parentId: row.parent_id,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }
}

/** Admin: all categories (including inactive). */
export async function getAllCategories(): Promise<Category[]> {
  await requirePermission('MANAGE_CMS')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) {
    throw new Error(`Gagal memuat kategori: ${error.message}`)
  }
  return (data ?? []).map(mapCategory)
}

export async function getCategoryById(
  id: string
): Promise<Category | null> {
  await requirePermission('MANAGE_CMS')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) {
    throw new Error(`Gagal memuat kategori: ${error.message}`)
  }
  return data ? mapCategory(data) : null
}

/** Admin: create a category. */
export async function createCategory(input: CategoryInput): Promise<string> {
  await requirePermission('MANAGE_CMS')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description,
      parent_id: input.parentId,
      sort_order: input.sortOrder,
      image_url: input.imageUrl,
      is_active: true,
    })
    .select('id')
    .single()
  if (error) {
    throw new Error(mapAdminError(error.code, 'Gagal membuat kategori.'))
  }
  return data.id
}

/** Admin: update a category. */
export async function updateCategory(
  id: string,
  input: CategoryInput
): Promise<void> {
  await requirePermission('MANAGE_CMS')
  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .update({
      name: input.name,
      slug: input.slug,
      description: input.description,
      parent_id: input.parentId,
      sort_order: input.sortOrder,
      image_url: input.imageUrl,
    })
    .eq('id', id)
  if (error) {
    throw new Error(mapAdminError(error.code, 'Gagal memperbarui kategori.'))
  }
}

/** Admin: toggle a category active/inactive. */
export async function setCategoryActive(
  id: string,
  active: boolean
): Promise<void> {
  await requirePermission('MANAGE_CMS')
  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .update({ is_active: active })
    .eq('id', id)
  if (error) {
    throw new Error(mapAdminError(error.code, 'Gagal mengubah status kategori.'))
  }
}

// ---------------------------------------------------------------------------
// CMS / site settings
// ---------------------------------------------------------------------------

/** Admin: read a typed site setting by key (memoized). */
export const getSiteSetting = cache(
  async (key: string): Promise<string | null> => {
    await requirePermission('MANAGE_CMS')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    if (error) {
      throw new Error(`Gagal memuat pengaturan: ${error.message}`)
    }
    if (!data || data.value === null || data.value === undefined) return null
    return typeof data.value === 'string' ? data.value : String(data.value)
  }
)

/** Admin: all settings for the CMS console. */
export async function getSiteSettings(): Promise<
  { key: string; value: string | null; description: string | null }[]
> {
  await requirePermission('MANAGE_CMS')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('settings')
    .select('key, value, description')
    .order('key', { ascending: true })
  if (error) {
    throw new Error(`Gagal memuat pengaturan: ${error.message}`)
  }
  return (data ?? []).map((row) => ({
    key: row.key,
    value: row.value === null || row.value === undefined ? null : String(row.value),
    description: row.description,
  }))
}

/** Admin: upsert a single setting value. */
export async function setSiteSetting(
  key: string,
  value: string,
  description?: string | null
): Promise<void> {
  await requirePermission('MANAGE_CMS')
  const supabase = await createClient()
  const row: SettingInsert = { key, value }
  if (description !== undefined) row.description = description
  const { error } = await supabase.from('settings').upsert(row)
  if (error) {
    throw new Error(mapAdminError(error.code, 'Gagal menyimpan pengaturan.'))
  }
}

/** Typed convenience accessor for the public-site settings block. */
export async function getPublicSiteSettings(): Promise<{
  siteName: string
  tagline: string
  supportEmail: string
  about: string
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['site.name', 'site.tagline', 'site.support_email', 'site.about'])
  if (error) {
    return { siteName: 'Warungpedia', tagline: '', supportEmail: '', about: '' }
  }
  const map = new Map<string, string>()
  for (const row of data ?? []) {
    const v = row.value
    map.set(row.key, typeof v === 'string' ? v : v == null ? '' : String(v))
  }
  return {
    siteName: map.get('site.name') || 'Warungpedia',
    tagline: map.get('site.tagline') || '',
    supportEmail: map.get('site.support_email') || '',
    about: map.get('site.about') || '',
  }
}

/** Maps Postgres error codes to safe, user-facing Indonesian messages. */
function mapAdminError(code: string | null, fallback: string): string {
  switch (code) {
    case '42501':
      return 'Anda tidak memiliki izin untuk melakukan tindakan ini.'
    case '23505':
      return 'Data sudah ada.'
    case '23514':
      return 'Data tidak valid.'
    case 'P0002':
      return 'Data tidak ditemukan.'
    default:
      return fallback
  }
}
