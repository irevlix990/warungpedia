import { revalidateTag } from 'next/cache'

/**
 * Cache tags used for on-demand invalidation of frequently-reused public
 * catalog data (categories, stores, products). Reads that opt into caching
 * tag their entries with these values; mutations call the `purge*` helpers
 * (from Server Actions) to drop the affected entries.
 */

export const CacheTags = {
  CATEGORY: 'category',
  STORE: 'store',
  PRODUCT: 'product',
} as const

/** Purge category cache entries (admin category create/update/toggle). */
export function purgeCategoryCache(): void {
  revalidateTag(CacheTags.CATEGORY, 'max')
}

/** Purge product cache entries (product create/update/delete/moderation). */
export function purgeProductCache(): void {
  revalidateTag(CacheTags.PRODUCT, 'max')
}

/** Purge store cache entries (store update/approve/suspend). */
export function purgeStoreCache(): void {
  revalidateTag(CacheTags.STORE, 'max')
}
