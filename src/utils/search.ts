export const PRODUCT_SORTS = [
  'relevancy',
  'newest',
  'price-asc',
  'price-desc',
] as const

export type ProductSort = (typeof PRODUCT_SORTS)[number]

export const DEFAULT_PRODUCT_SORT: ProductSort = 'relevancy'

export const SEARCH_PAGE_SIZE = 24

/** Parses an untrusted sort string into a valid ProductSort (default when unknown). */
export function parseProductSort(value: string | undefined): ProductSort {
  if (value && (PRODUCT_SORTS as readonly string[]).includes(value)) {
    return value as ProductSort
  }
  return DEFAULT_PRODUCT_SORT
}

/** Parses an untrusted 1-based page number; falls back to 1 on invalid input. */
export function parsePage(value: string | undefined): number {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) return 1
  return n
}

/** Computes the OFFSET for pagination, clamped to a safe maximum. */
export function paginationOffset(page: number, pageSize: number): number {
  const safePage = Math.max(1, Math.floor(page))
  return Math.max(0, (safePage - 1) * pageSize)
}

/** Computes total pages from a total count and page size. */
export function totalPages(total: number, pageSize: number): number {
  if (pageSize <= 0) return 0
  return Math.max(1, Math.ceil(total / pageSize))
}
