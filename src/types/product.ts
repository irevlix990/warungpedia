export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const

export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export const PRODUCT_CONDITIONS = ['new', 'used'] as const

export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number]

/** Public seller product DTO (server-derived from `products` rows). */
export interface Product {
  id: string
  storeId: string
  categoryId: string | null
  slug: string
  name: string
  description: string | null
  brand: string | null
  condition: ProductCondition
  price: number
  compareAtPrice: number | null
  /** Active flash-sale price when one applies (display overlay), else null. */
  discountedPrice?: number | null
  imageUrls: string[]
  stock: number
  lowStockThreshold: number
  weightGrams: number | null
  status: ProductStatus
  isFeatured: boolean
  reviewsCount: number
  ratingAvg: number
  createdAt: string
  updatedAt: string
}

/** Same shape as a validated product create/update form submission. */
export interface ProductInput {
  name: string
  slug?: string
  description?: string
  brand?: string
  categoryId?: string | null
  condition: ProductCondition
  price: number
  compareAtPrice?: number | null
  imageUrls?: string[]
  stock: number
  lowStockThreshold: number
  weightGrams?: number | null
  status: ProductStatus
  isFeatured?: boolean
}
