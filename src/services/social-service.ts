import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { requireUserOrThrow } from '@/lib/auth/dal'
import type { Database } from '@/types/database'
import type {
  ProductReview,
  ReviewInput,
  StoreFollow,
  Wishlist,
  WishlistItem,
} from '@/types/social'
import type { Product } from '@/types/product'

type ReviewRow = Database['public']['Tables']['product_reviews']['Row']
type WishlistRow = Database['public']['Tables']['wishlists']['Row']
type WishlistItemRow = Database['public']['Tables']['wishlist_items']['Row']

function mapReview(row: ReviewRow): ProductReview {
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
  }
}

function mapWishlist(row: WishlistRow): Wishlist {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
function mapSocialError(code: string | null, fallback: string): string {
  switch (code) {
    case 'P0002':
    case '23514':
    case '23505':
    case '42501':
      return fallback
    default:
      return fallback
  }
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

/** Public: ACTIVE reviews for a product, newest first, joined to nothing. */
export const getReviewsForProduct = cache(
  async (productId: string): Promise<ProductReview[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
    if (error) {
      throw new Error('Gagal memuat ulasan.')
    }
    return (data ?? []).map(mapReview)
  }
)

/** Public: ACTIVE reviews for a store, newest first. */
export const getReviewsForStore = cache(
  async (storeId: string): Promise<ProductReview[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
    if (error) {
      throw new Error('Gagal memuat ulasan toko.')
    }
    return (data ?? []).map(mapReview)
  }
)

/**
 * The acting user's review for a product, if any (returns null otherwise).
 * RLS exposes only the owner's own hidden reviews plus public ones.
 */
export const getMyReviewForProduct = cache(
  async (productId: string): Promise<ProductReview | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .maybeSingle()
    if (error) {
      throw new Error('Gagal memuat ulasan Anda.')
    }
    return data ? mapReview(data) : null
  }
)

/**
 * Whether the acting user can review a product and, if so, which completed
 * order to attach. Requires a DELIVERED/COMPLETED order containing the product
 * and no existing review.
 */
export const getReviewEligibility = cache(
  async (productId: string): Promise<{ orderId: string | null; already: boolean }> => {
    const supabase = await createClient()

    const mine = await getMyReviewForProduct(productId)
    if (mine) return { orderId: null, already: true }

    const { data, error } = await supabase
      .from('orders')
      .select('id, status, order_items!inner(product_id)')
      .in('status', ['DELIVERED', 'COMPLETED'])
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) {
      throw new Error('Gagal memeriksa kelayakan ulasan.')
    }

    const order = (data ?? []).find((o) =>
      (o.order_items as unknown as { product_id: string }[]).some(
        (it) => it.product_id === productId
      )
    )
    return { orderId: order?.id ?? null, already: false }
  }
)

/** Create a review for a product on a completed order (authoritative RPC). */
export async function createReview(
  productId: string,
  orderId: string,
  input: ReviewInput
): Promise<string> {
  const user = await requireUserOrThrow()
  void user
  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc('create_review', {
    p_order_id: orderId,
    p_product_id: productId,
    p_rating: input.rating,
    p_title: input.title ?? null,
    p_body: input.body,
  })
  if (error) {
    throw new Error(mapSocialError(error.code, 'Gagal menyimpan ulasan.'))
  }
  if (!id) throw new Error('Gagal menyimpan ulasan.')
  return id
}

/** Update the acting user's own review. */
export async function updateReview(
  reviewId: string,
  input: ReviewInput
): Promise<void> {
  await requireUserOrThrow()
  const supabase = await createClient()
  const { error } = await supabase.rpc('update_review', {
    p_review_id: reviewId,
    p_rating: input.rating,
    p_title: input.title ?? null,
    p_body: input.body,
  })
  if (error) {
    throw new Error(mapSocialError(error.code, 'Gagal memperbarui ulasan.'))
  }
}

/** Hide (owner/admin) or un-hide (admin) a review. */
export async function setReviewHidden(
  reviewId: string,
  hidden: boolean
): Promise<void> {
  await requireUserOrThrow()
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_review_status', {
    p_review_id: reviewId,
    p_status: hidden ? 'HIDDEN' : 'ACTIVE',
  })
  if (error) {
    throw new Error(mapSocialError(error.code, 'Gagal mengubah status ulasan.'))
  }
}

// ---------------------------------------------------------------------------
// Store following
// ---------------------------------------------------------------------------

/** Toggle follow for the acting user; returns the new following state. */
export async function toggleStoreFollow(storeId: string): Promise<boolean> {
  await requireUserOrThrow()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('toggle_store_follow', {
    p_store_id: storeId,
  })
  if (error) {
    throw new Error(mapSocialError(error.code, 'Gagal mengubah status ikuti.'))
  }
  return data ?? false
}

/** Set of store ids the acting user follows (button state). */
export const getFollowedStoreIds = cache(async (): Promise<Set<string>> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from('store_follows').select('store_id')
  if (error) return new Set()
  return new Set((data ?? []).map((r) => r.store_id))
})

/** The acting user's followed stores (with store name/slug/logo). */
export const getFollowedStores = cache(async (): Promise<
  (StoreFollow & { name: string; slug: string; logoUrl: string | null; ratingAvg: number })[]
> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('store_follows')
    .select('*, stores(slug, name, logo_url, rating_avg)')
    .order('created_at', { ascending: false })
  if (error) {
    throw new Error('Gagal memuat toko yang diikuti.')
  }
  return (data ?? []).map((row) => {
    const store = row.stores as unknown as {
      slug: string
      name: string
      logo_url: string | null
      rating_avg: number
    }
    return {
      userId: row.user_id,
      storeId: row.store_id,
      createdAt: row.created_at,
      name: store?.name ?? '',
      slug: store?.slug ?? '',
      logoUrl: store?.logo_url ?? null,
      ratingAvg: store?.rating_avg ?? 0,
    }
  })
})

// ---------------------------------------------------------------------------
// Wishlists
// ---------------------------------------------------------------------------

/** The acting user's wishlist collections, newest first, with item counts. */
export const getMyWishlists = cache(
  async (): Promise<(Wishlist & { itemCount: number })[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('wishlists')
      .select('*, wishlist_items(count)')
      .order('created_at', { ascending: false })
    if (error) {
      throw new Error('Gagal memuat koleksi.')
    }
    return (data ?? []).map((row) => ({
      ...mapWishlist(row),
      itemCount:
        (row.wishlist_items as unknown as { count: number }[])[0]?.count ?? 0,
    }))
  }
)

/** Set of product ids present in any of the acting user's wishlists. */
export const getWishlistedProductIds = cache(async (): Promise<Set<string>> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wishlists')
    .select('wishlist_items(product_id)')
  if (error) return new Set()
  const items = (data ?? []).flatMap(
    (w) => w.wishlist_items as unknown as { product_id: string }[]
  )
  return new Set(items.map((it) => it.product_id))
})

/**
 * A single collection with its product items enriched with product data
 * (each product carries the owning store's slug for deep linking).
 */
export const getWishlistById = cache(
  async (
    id: string
  ): Promise<{
    wishlist: Wishlist
    items: (WishlistItem & { product: Product & { storeSlug: string } })[]
  } | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('wishlists')
      .select('*, wishlist_items(*, products(*, stores(slug)))')
      .eq('id', id)
      .maybeSingle()
    if (error) {
      throw new Error('Gagal memuat koleksi.')
    }
    if (!data) return null

    const rawItems = data.wishlist_items as unknown as (WishlistItemRow & {
      products: Database['public']['Tables']['products']['Row'] & {
        stores: { slug: string } | { slug: string }[]
      }
    })[]

    const { mapProduct } = await import('./product-service')
    const items: (WishlistItem & { product: Product & { storeSlug: string } })[] =
      []
    for (const it of rawItems) {
      if (!it.products) continue
      const store = it.products.stores
      const slug = Array.isArray(store) ? store[0]?.slug : store?.slug
      if (!slug) continue
      items.push({
        wishlistId: it.wishlist_id,
        productId: it.product_id,
        notes: it.notes,
        createdAt: it.created_at,
        product: { ...mapProduct(it.products), storeSlug: slug },
      })
    }
    return { wishlist: mapWishlist(data), items }
  }
)

/** Create a named collection. */
export async function createWishlist(name: string): Promise<string> {
  await requireUserOrThrow()
  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc('create_wishlist', { p_name: name })
  if (error) {
    throw new Error(mapSocialError(error.code, 'Gagal membuat koleksi.'))
  }
  if (!id) throw new Error('Gagal membuat koleksi.')
  return id
}

/** Rename a collection (owner only). */
export async function renameWishlist(id: string, name: string): Promise<void> {
  await requireUserOrThrow()
  const supabase = await createClient()
  const { error } = await supabase.rpc('rename_wishlist', {
    p_wishlist_id: id,
    p_name: name,
  })
  if (error) {
    throw new Error(mapSocialError(error.code, 'Gagal mengganti nama koleksi.'))
  }
}

/** Delete a collection (owner only). */
export async function deleteWishlist(id: string): Promise<void> {
  await requireUserOrThrow()
  const supabase = await createClient()
  const { error } = await supabase.rpc('delete_wishlist', { p_wishlist_id: id })
  if (error) {
    throw new Error(mapSocialError(error.code, 'Gagal menghapus koleksi.'))
  }
}

/** Add a product to a wishlist (uses the default "Tersimpan" if none given). */
export async function addToWishlist(
  productId: string,
  wishlistId?: string | null,
  notes?: string | null
): Promise<string> {
  await requireUserOrThrow()
  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc('add_to_wishlist', {
    p_product_id: productId,
    p_wishlist_id: wishlistId ?? null,
    p_notes: notes ?? null,
  })
  if (error) {
    throw new Error(mapSocialError(error.code, 'Gagal menambahkan ke koleksi.'))
  }
  if (!id) throw new Error('Gagal menambahkan ke koleksi.')
  return id
}

/** Remove a product from a wishlist (owner only). */
export async function removeFromWishlist(
  wishlistId: string,
  productId: string
): Promise<void> {
  await requireUserOrThrow()
  const supabase = await createClient()
  const { error } = await supabase.rpc('remove_from_wishlist', {
    p_wishlist_id: wishlistId,
    p_product_id: productId,
  })
  if (error) {
    throw new Error(mapSocialError(error.code, 'Gagal menghapus dari koleksi.'))
  }
}

// ---------------------------------------------------------------------------
// Views, recently viewed, related products
// ---------------------------------------------------------------------------

/** Logs a product page view (recommendation foundation). Best-effort. */
export async function recordProductView(productId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc('record_product_view', { p_product_id: productId })
}

/** The acting user's recently viewed products (newest distinct first). */
export async function getRecentlyViewedProducts(
  limit = 12
): Promise<(Product & { storeSlug: string })[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_recently_viewed', {
    p_limit: limit,
  })
  if (error || !data) return []
  const { mapProduct } = await import('./product-service')
  const products: (Product & { storeSlug: string })[] = []
  for (const row of data as { product_id: string }[]) {
    const { data: p } = await supabase
      .from('products')
      .select('*, stores!inner(slug)')
      .eq('id', row.product_id)
      .maybeSingle()
    if (!p) continue
    const store = p.stores as unknown as { slug: string } | { slug: string }[] | null
    const slug = Array.isArray(store) ? store[0]?.slug : store?.slug
    if (!slug) continue
    products.push({ ...mapProduct(p), storeSlug: slug })
  }
  return products
}

/** Related products to a product, as full products usable by ProductCard. */
export const getRelatedProducts = cache(
  async (
    productId: string,
    limit = 8
  ): Promise<(Product & { storeSlug: string })[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_related_products', {
      p_product_id: productId,
      p_limit: limit,
    })
    if (error) return []
    const ids = ((data as { product_id: string }[]) ?? []).map((r) => r.product_id)
    if (ids.length === 0) return []

    const { mapProduct } = await import('./product-service')
    const products: (Product & { storeSlug: string })[] = []
    for (const id of ids) {
      const { data: p } = await supabase
        .from('products')
        .select('*, stores!inner(slug)')
        .eq('id', id)
        .maybeSingle()
      if (!p) continue
      const store =
        p.stores as unknown as { slug: string } | { slug: string }[] | null
      const slug = Array.isArray(store) ? store[0]?.slug : store?.slug
      if (!slug) continue
      products.push({ ...mapProduct(p), storeSlug: slug })
    }
    return products
  }
)

export type FollowedStore = Awaited<ReturnType<typeof getFollowedStores>>[number]
