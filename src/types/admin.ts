import type { Role } from '@/config/roles'

/** Aggregate KPIs surfaced on the admin dashboard. */
export interface AdminStats {
  totalUsers: number
  totalBuyers: number
  totalSellers: number
  totalAdmins: number
  totalStores: number
  pendingStores: number
  activeStores: number
  totalProducts: number
  activeProducts: number
  totalOrders: number
  committedOrders: number
  gmv: number
  pendingWithdrawals: number
  pendingWithdrawalsValue: number
  openDisputes: number
  pendingReturns: number
  hiddenReviews: number
}

/** A user as seen by the admin user-management list. */
export interface AdminUser {
  id: string
  fullName: string | null
  email: string | null
  phone: string | null
  role: Role
  emailVerified: boolean | null
  createdAt: string
  updatedAt: string
}

/** A product row as seen by the admin moderation list. */
export interface AdminProduct {
  id: string
  name: string
  slug: string
  storeId: string
  storeName: string | null
  categoryId: string | null
  categoryName: string | null
  price: number
  stock: number
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  isFeatured: boolean
  ratingAvg: number
  reviewsCount: number
  createdAt: string
}

export type ProductModerationStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

/** Input to moderate a product's status / featured flag. */
export interface ProductModerationInput {
  status?: ProductModerationStatus
  featured?: boolean
}

/** Category input for admin category management. */
export interface CategoryInput {
  name: string
  slug: string
  description: string | null
  parentId: string | null
  sortOrder: number
  imageUrl: string | null
}

/** A key/value site setting managed through the CMS. */
export interface SiteSetting {
  key: string
  value: string
  description: string | null
  updatedAt: string
}

export interface SiteSettingsInput {
  siteName: string
  tagline: string
  supportEmail: string
  about: string
}

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'

/** An order as seen by the admin order-management list. */
export interface AdminOrder {
  id: string
  userId: string
  buyerName: string | null
  status: OrderStatus
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  itemCount: number
  createdAt: string
}
