import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * SEO service — read-only access used to build the XML sitemap. Only
 * publicly reachable entities (active categories, active stores and their
 * active products) are returned so crawlers never get dead URLs.
 */

export interface SitemapCategoryEntry {
  slug: string
  updatedAt: string | null
}

export interface SitemapStoreEntry {
  slug: string
  updatedAt: string | null
}

export interface SitemapProductEntry {
  storeSlug: string
  productSlug: string
  updatedAt: string | null
}

export const getSitemapCategories = cache(
  async (): Promise<SitemapCategoryEntry[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('slug, updated_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw new Error(`Gagal memuat sitemap kategori: ${error.message}`)
    return (data ?? []).map((row) => ({
      slug: row.slug,
      updatedAt: row.updated_at ?? null,
    }))
  }
)

export const getSitemapStores = cache(
  async (): Promise<SitemapStoreEntry[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('stores')
      .select('id, slug, updated_at')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Gagal memuat sitemap toko: ${error.message}`)
    return (data ?? []).map((row) => ({
      slug: row.slug,
      updatedAt: row.updated_at ?? null,
    }))
  }
)

/** Active products that belong to active stores (store slug included). */
export const getSitemapProducts = cache(
  async (): Promise<SitemapProductEntry[]> => {
    const supabase = await createClient()

    const storeRes = await supabase
      .from('stores')
      .select('id, slug')
      .eq('status', 'ACTIVE')
    if (storeRes.error) {
      throw new Error(`Gagal memuat sitemap toko: ${storeRes.error.message}`)
    }
    const storeBySlug = new Map<string, string>()
    for (const store of storeRes.data ?? []) {
      storeBySlug.set(store.id, store.slug)
    }
    const activeStoreIds = [...storeBySlug.keys()]
    if (activeStoreIds.length === 0) return []

    const maxIn = 900
    const entries: SitemapProductEntry[] = []
    for (let i = 0; i < activeStoreIds.length; i += maxIn) {
      const chunk = activeStoreIds.slice(i, i + maxIn)
      const { data, error } = await supabase
        .from('products')
        .select('slug, store_id, updated_at')
        .in('store_id', chunk)
        .eq('status', 'ACTIVE')
      if (error) {
        throw new Error(`Gagal memuat sitemap produk: ${error.message}`)
      }
      for (const product of data ?? []) {
        const storeSlug = storeBySlug.get(product.store_id)
        if (storeSlug) {
          entries.push({
            storeSlug,
            productSlug: product.slug,
            updatedAt: product.updated_at ?? null,
          })
        }
      }
    }
    return entries
  }
)
