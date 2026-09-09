export const STORE_STATUSES = [
  'PENDING',
  'ACTIVE',
  'REJECTED',
  'SUSPENDED',
  'CLOSED',
] as const

export type StoreStatus = (typeof STORE_STATUSES)[number]

/** Seller badges: OFFICIAL = verified by Warungpedia, MALL = large store, STAR = good seller, null = no badge. */
export const SELLER_BADGES = ['OFFICIAL', 'MALL', 'STAR'] as const
export type SellerBadge = (typeof SELLER_BADGES)[number]

export const SELLER_BADGE_LABELS: Record<SellerBadge, string> = {
  OFFICIAL: 'Official',
  MALL: 'Mall',
  STAR: 'Star',
}

/** Public seller store DTO (server-derived from `stores` rows). */
export interface Store {
  id: string
  ownerId: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  logoUrl: string | null
  bannerUrl: string | null
  contactEmail: string
  phone: string | null
  province: string | null
  city: string | null
  district: string | null
  village: string | null
  status: StoreStatus
  badge: SellerBadge | null
  rejectionReason: string | null
  approvedAt: string | null
  ratingAvg: number
  ratingCount: number
  createdAt: string
  updatedAt: string
}

/** Same shape as a validated store form submission. */
export interface StoreInput {
  name: string
  slug?: string
  tagline?: string
  description?: string
  contactEmail: string
  phone?: string
  province: string
  city: string
  district?: string
  village?: string
  logoUrl?: string | null
  bannerUrl?: string | null
}