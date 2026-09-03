import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/types/catalog'
import type { Database } from '@/types/database'

type CategoryRow = Database['public']['Tables']['categories']['Row']

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

/**
 * Catalog service — read-only access to the public category taxonomy.
 * Category writes are an admin concern (later phase); here we expose the
 * data that drives the homepage, catalog pages and search.
 */

/** All active categories, ordered by sort_order then name. */
export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Gagal memuat kategori: ${error.message}`)
  }

  return (data ?? []).map(mapCategory)
})

/** A single active category by slug, or null when not found/inactive. */
export const getCategoryBySlug = cache(
  async (slug: string): Promise<Category | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      throw new Error(`Gagal memuat kategori: ${error.message}`)
    }

    return data ? mapCategory(data) : null
  }
)

/**
 * Lightweight search over category name/description. Full product search
 * arrives with the search & discovery phase.
 */
export const searchCategories = cache(
  async (query: string): Promise<Category[]> => {
    const term = query.trim()
    if (!term) {
      return []
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
      .order('sort_order', { ascending: true })
      .limit(30)

    if (error) {
      throw new Error(`Gagal mencari kategori: ${error.message}`)
    }

    return (data ?? []).map(mapCategory)
  }
)