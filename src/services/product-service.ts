import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/utils/slugify'
import { flashSalePrice } from '@/utils/promotions'
import { getActiveFlashSalesByProduct } from './promotions-service'
import {
  paginationOffset,
  totalPages,
  type ProductSort,
} from '@/utils/search'
import type { Database } from '@/types/database'
import type {
  Product,
  ProductInput,
  ProductStatus,
} from '@/types/product'

type ProductRow = Database['public']['Tables']['products']['Row']

/** Fallback slug when the derived slug is empty. */
const FALLBACK_SLUG = 'produk-warungpedia'

/** Maps a products row to the public Product DTO. */
export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    storeId: row.store_id,
    categoryId: row.category_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    brand: row.brand,
    condition: row.condition,
    price: row.price,
    compareAtPrice: row.compare_at_price,
    imageUrls: row.image_urls ?? [],
    stock: row.stock,
    lowStockThreshold: row.low_stock_threshold,
    weightGrams: row.weight_grams,
    status: row.status,
    isFeatured: row.is_featured,
    reviewsCount: row.reviews_count ?? 0,
    ratingAvg: Number(row.rating_avg ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Derives a unique-safe slug from the product name (or explicit slug). */
export function resolveProductSlug(name: string, slug?: string): string {
  const candidate = (slug ?? '').trim() || name
  return slugify(candidate) || FALLBACK_SLUG
}

/**
 * A single public, ACTIVE product belonging to an ACTIVE store, addressed by
 * store slug + product slug. Useful for storefront product detail pages.
 */
export const getPublicProductInStore = cache(
  async (
    storeSlug: string,
    productSlug: string
  ): Promise<Product | null> => {
    const supabase = await createClient()

    const storeRes = await supabase
      .from('stores')
      .select('id')
      .eq('slug', storeSlug)
      .eq('status', 'ACTIVE')
      .maybeSingle()
    if (storeRes.error) {
      throw new Error('Gagal memuat toko.')
    }
    if (!storeRes.data) return null

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeRes.data.id)
      .eq('slug', productSlug)
      .eq('status', 'ACTIVE')
      .maybeSingle()

    if (error) {
      throw new Error('Gagal memuat produk.')
    }

    return data ? mapProduct(data) : null
  }
)

/**
 * Public product by its unique id (must be ACTIVE and belong to an ACTIVE
 * store). Used by cards/links that already know the product id.
 */
export const getPublicProductById = cache(
  async (id: string): Promise<Product | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('status', 'ACTIVE')
      .maybeSingle()

    if (error) {
      throw new Error('Gagal memuat produk.')
    }

    if (!data) return null

    const stores = await supabase
      .from('stores')
      .select('status')
      .eq('id', data.store_id)
      .maybeSingle()
    if (stores.error) {
      throw new Error('Gagal memuat toko.')
    }
    if (!stores.data || stores.data.status !== 'ACTIVE') return null

    return mapProduct(data)
  }
)

/**
 * Products for a store's public storefront (ACTIVE only), newest first.
 * RLS already restricts to active-store rows; filters are defense-in-depth.
 */
export const getPublicProductsByStore = cache(
  async (storeId: string): Promise<Product[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Gagal memuat daftar produk.')
    }

    return (data ?? []).map(mapProduct)
  }
)

export interface ProductSearchQuery {
  term: string
  categoryId?: string | null
  sort?: ProductSort
  page?: number
  pageSize?: number
}

/** A public search hit: a Product plus its owning store's display info. */
export interface SearchProduct extends Product {
  storeSlug: string
  storeName: string
}

export interface ProductSearchResult {
  products: SearchProduct[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const PRODUCT_SORT_ORDER: Record<
  ProductSort,
  { column: keyof ProductRow; ascending: boolean }
> = {
  relevancy: { column: 'created_at', ascending: false },
  newest: { column: 'created_at', ascending: false },
  'price-asc': { column: 'price', ascending: true },
  'price-desc': { column: 'price', ascending: false },
}

/**
 * Public product search across all ACTIVE stores. RLS already limits reads to
 * ACTIVE products in ACTIVE stores, so this query is consumer-facing by
 * construction. Supports keyword filtering (name/brand/description), an
 * optional category filter, and a whitelisted set of sort orders, with
 * offset/limit pagination.
 */
export async function searchProducts(
  query: ProductSearchQuery
): Promise<ProductSearchResult> {
  const term = query.term.trim()
  const sort = query.sort ?? 'relevancy'
  const pageSize = query.pageSize ?? 24
  const page = query.page ?? 1
  const order = PRODUCT_SORT_ORDER[sort] ?? PRODUCT_SORT_ORDER.relevancy

  const supabase = await createClient()
  const rangeStart = paginationOffset(page, pageSize)
  const rangeEnd = rangeStart + pageSize - 1

  const buildCount = () => {
    let q = supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE')
    if (term) {
      q = q.or(
        `name.ilike.%${term}%,brand.ilike.%${term}%,description.ilike.%${term}%`
      )
    }
    if (query.categoryId) {
      q = q.eq('category_id', query.categoryId)
    }
    return q
  }

  const buildList = () => {
    let q = supabase.from('products').select('*').eq('status', 'ACTIVE')
    if (term) {
      q = q.or(
        `name.ilike.%${term}%,brand.ilike.%${term}%,description.ilike.%${term}%`
      )
    }
    if (query.categoryId) {
      q = q.eq('category_id', query.categoryId)
    }
    return q
  }

  const { count, error: countError } = await buildCount()
  if (countError) {
    throw new Error('Gagal menghitung hasil pencarian.')
  }

  const { data, error } = await buildList()
    .order(order.column, { ascending: order.ascending })
    .range(rangeStart, rangeEnd)

  if (error) {
    throw new Error('Gagal memuat hasil pencarian.')
  }

  const rows = data ?? []
  const storeIds = [...new Set(rows.map((r) => r.store_id))]

  let storeMap: Map<string, { slug: string; name: string }> = new Map()
  if (storeIds.length > 0) {
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, slug, name')
      .in('id', storeIds)
    if (storesError) {
      throw new Error('Gagal memuat toko.')
    }
    storeMap = new Map(
      (stores ?? []).map((s) => [s.id, { slug: s.slug, name: s.name }])
    )
  }

  const activeFlash = await getActiveFlashSalesByProduct(
    rows.map((r) => r.id)
  ).catch(() => new Map())

  const products: SearchProduct[] = rows
    .map((row) => {
      const store = storeMap.get(row.store_id)
      if (!store) return null
      const mapped = mapProduct(row)
      const sale = activeFlash.get(row.id)
      if (sale) {
        mapped.discountedPrice = flashSalePrice(mapped.price, sale)
      }
      return { ...mapped, storeSlug: store.slug, storeName: store.name }
    })
    .filter((p): p is SearchProduct => p !== null)

  const total = count ?? products.length
  return {
    products,
    total,
    page,
    pageSize,
    totalPages: totalPages(total, pageSize),
  }
}
export const getProductsByOwner = cache(
  async (ownerId: string): Promise<Product[]> => {
    const supabase = await createClient()

    const storeRes = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', ownerId)
      .maybeSingle()
    if (storeRes.error) {
      throw new Error('Gagal memuat toko.')
    }
    if (!storeRes.data) {
      return []
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeRes.data.id)
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error('Gagal memuat produk.')
    }

    return (data ?? []).map(mapProduct)
  }
)

/** Creates a product via the definer function (owner of ACTIVE store). */
export async function createProduct(
  storeId: string,
  input: ProductInput
): Promise<Product> {
  const slug = resolveProductSlug(input.name, input.slug)
  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc('create_product', {
    p_store_id: storeId,
    p_category_id: input.categoryId ?? null,
    p_slug: slug,
    p_name: input.name.trim(),
    p_description: (input.description ?? '').trim(),
    p_brand: (input.brand ?? '').trim(),
    p_condition: input.condition,
    p_price: input.price,
    p_compare_at_price: input.compareAtPrice ?? null,
    p_image_urls: input.imageUrls ?? [],
    p_stock: input.stock,
    p_low_stock_threshold: input.lowStockThreshold,
    p_weight_grams: input.weightGrams ?? null,
    p_status: input.status,
  })

  if (error) {
    throw new Error(mapProductError(error.code, error.message))
  }

  if (!id) {
    throw new Error('Gagal menyimpan produk.')
  }

  const product = await getOwnableProductById(id).catch(() => null)
  if (!product) {
    throw new Error('Gagal memuat produk yang baru dibuat.')
  }
  return product
}

/** Updates product details via the definer function. */
export async function updateProductDetails(
  productId: string,
  input: ProductInput
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('update_product', {
    p_product_id: productId,
    p_category_id: input.categoryId ?? null,
    p_slug: resolveProductSlug(input.name, input.slug),
    p_name: input.name.trim(),
    p_description: (input.description ?? '').trim(),
    p_brand: (input.brand ?? '').trim(),
    p_condition: input.condition,
    p_price: input.price,
    p_compare_at_price: input.compareAtPrice ?? null,
    p_image_urls: input.imageUrls ?? [],
    p_low_stock_threshold: input.lowStockThreshold,
    p_weight_grams: input.weightGrams ?? null,
    p_is_featured: input.isFeatured ?? false,
  })

  if (error) {
    throw new Error(mapProductError(error.code, error.message))
  }
}

/** Sets a product's status (lifecycle transition). */
export async function setProductStatus(
  productId: string,
  status: ProductStatus
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_product_status', {
    p_product_id: productId,
    p_status: status,
  })
  if (error) {
    throw new Error(mapProductError(error.code, error.message))
  }
}

/** Sets a product's stock. */
export async function setProductStock(
  productId: string,
  stock: number
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_product_stock', {
    p_product_id: productId,
    p_stock: stock,
  })
  if (error) {
    throw new Error(mapProductError(error.code, error.message))
  }
}

/** Deletes a product (sellers: DRAFT/ARCHIVED only). */
export async function removeProduct(productId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('delete_product', {
    p_product_id: productId,
  })
  if (error) {
    throw new Error(mapProductError(error.code, error.message))
  }
}

/** Reads one of the acting user's own products (RLS-scoped). */
export const getOwnableProductById = cache(
  async (id: string): Promise<Product | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw new Error('Gagal memuat produk.')
    }

    return data ? mapProduct(data) : null
  }
)

/** Maps common Postgres/RLS errors to friendly, user-safe messages. */
function mapProductError(code: string | null, message: string): string {
  switch (code) {
    case '23505':
      return 'Slug produk sudah digunakan dalam toko ini.'
    case '42501':
      return 'Anda tidak memiliki izin untuk melakukan tindakan ini.'
    case '23514':
      return message
    case 'P0002':
      return message
    default:
      return 'Gagal memproses produk.'
  }
}
