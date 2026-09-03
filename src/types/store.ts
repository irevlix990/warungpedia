export const STORE_STATUSES = [
  'PENDING',
  'ACTIVE',
  'REJECTED',
  'SUSPENDED',
  'CLOSED',
] as const

export type StoreStatus = (typeof STORE_STATUSES)[number]

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
  status: StoreStatus
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
  logoUrl?: string | null
  bannerUrl?: string | null
}