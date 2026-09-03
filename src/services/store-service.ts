import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/utils/slugify'
import type { Database } from '@/types/database'
import type { Store, StoreInput, StoreStatus } from '@/types/store'

type StoreRow = Database['public']['Tables']['stores']['Row']

/** Fallback slug when the derived slug is empty. */
const FALLBACK_SLUG = 'toko-warungpedia'

function mapStore(row: StoreRow): Store {
  return {
    id: row.id,
    ownerId: row.owner_id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url,
    contactEmail: row.contact_email,
    phone: row.phone,
    province: row.province,
    city: row.city,
    status: row.status,
    rejectionReason: row.rejection_reason,
    approvedAt: row.approved_at,
    ratingAvg: Number(row.rating_avg ?? 0),
    ratingCount: Number(row.rating_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Derives a unique-safe slug from the store name (or explicit slug). */
export function resolveStoreSlug(name: string, slug?: string): string {
  const candidate = (slug ?? '').trim() || name
  return slugify(candidate) || FALLBACK_SLUG
}

/** The public, ACTIVE storefront by slug (else null). */
export const getStoreBySlug = cache(
  async (slug: string): Promise<Store | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'ACTIVE')
      .maybeSingle()

    if (error) {
      throw new Error('Gagal memuat toko.')
    }

    return data ? mapStore(data) : null
  }
)

/** The acting user's own store (any status, RLS-scoped). */
export const getStoreByOwner = cache(
  async (ownerId: string): Promise<Store | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle()

    if (error) {
      throw new Error('Gagal memuat toko.')
    }

    return data ? mapStore(data) : null
  }
)

/** Admin review queue: stores by status (e.g. PENDING). */
export async function getStoresByStatus(
  status: StoreStatus
): Promise<Store[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error('Gagal memuat daftar toko.')
  }

  return (data ?? []).map(mapStore)
}

/** Active stores matching a keyword in their name or tagline. */
export const searchActiveStores = cache(
  async (term: string): Promise<Store[]> => {
    const query = term.trim()
    if (!query) return []

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('status', 'ACTIVE')
      .or(`name.ilike.%${query}%,tagline.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(8)

    if (error) {
      throw new Error('Gagal mencari toko.')
    }

    return (data ?? []).map(mapStore)
  }
)
export async function createStoreApplication(
  ownerId: string,
  input: StoreInput
): Promise<Store> {
  const slug = resolveStoreSlug(input.name, input.slug)
  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc('create_store_application', {
    p_slug: slug,
    p_name: input.name.trim(),
    p_tagline: (input.tagline ?? '').trim(),
    p_description: (input.description ?? '').trim(),
    p_contact_email: input.contactEmail.trim(),
    p_phone: (input.phone ?? '').trim(),
    p_province: input.province.trim(),
    p_city: input.city.trim(),
    p_logo_url: (input.logoUrl ?? '').trim(),
    p_banner_url: (input.bannerUrl ?? '').trim(),
  })

  if (error) {
    throw new Error(mapStoreError(error.code, error.message))
  }

  const store = await getStoreByIdOrOwner(ownerId, slug)
  if (!store) {
    throw new Error('Gagal menyimpan pengajuan toko.')
  }
  void id
  return store
}

/** Updates store details via the definer function (owner-scoped). */
export async function updateStoreDetails(
  storeId: string,
  ownerId: string,
  input: StoreInput
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('update_store', {
    p_store_id: storeId,
    p_name: input.name.trim(),
    p_tagline: (input.tagline ?? '').trim(),
    p_description: (input.description ?? '').trim(),
    p_contact_email: input.contactEmail.trim(),
    p_phone: (input.phone ?? '').trim(),
    p_province: input.province.trim(),
    p_city: input.city.trim(),
    p_logo_url: (input.logoUrl ?? '').trim(),
    p_banner_url: (input.bannerUrl ?? '').trim(),
  })

  if (error) {
    throw new Error(mapStoreError(error.code, error.message))
  }

  void ownerId
}

/** Owner resubmits a rejected application (status back to PENDING). */
export async function resubmitStoreApplication(storeId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('resubmit_store', {
    p_store_id: storeId,
  })
  if (error) {
    throw new Error(mapStoreError(error.code, error.message))
  }
}

/** Admin approves a store; elevates the owner's role to SELLER. */
export async function approveStore(storeId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('approve_store', { p_store_id: storeId })
  if (error) {
    throw new Error(mapStoreError(error.code, error.message))
  }
}

/** Admin rejects a store with a reason visible to the owner. */
export async function rejectStore(
  storeId: string,
  reason: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('reject_store', {
    p_store_id: storeId,
    p_reason: reason,
  })
  if (error) {
    throw new Error(mapStoreError(error.code, error.message))
  }
}

/** Admin suspends a store (storefront hidden until re-approved). */
export async function suspendStore(storeId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('suspend_store', { p_store_id: storeId })
  if (error) {
    throw new Error(mapStoreError(error.code, error.message))
  }
}

async function getStoreByIdOrOwner(
  ownerId: string,
  slug: string
): Promise<Store | null> {
  const fromOwner = await getStoreByOwner(ownerId)
  if (fromOwner) return fromOwner
  return getStoreBySlug(slug)
}

/** Maps common Postgres/RLS errors to friendly, user-safe messages. */
function mapStoreError(code: string | null, message: string): string {
  switch (code) {
    case '23505':
      return 'Pengajuan toko atau slug sudah digunakan.'
    case '42501':
      return 'Anda tidak memiliki izin untuk melakukan tindakan ini.'
    case 'P0002':
      return message
    default:
      return 'Gagal memproses toko.'
  }
}