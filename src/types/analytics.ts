/** Analytics DTOs shared across seller and admin analytics surfaces. */

export type AnalyticsRange = '7d' | '30d' | '90d'

export interface SellerProductAnalytics {
  productId: string
  productName: string
  slug: string
  views: number
  ordersCount: number
  unitsSold: number
  revenueNet: number
}

export interface SellerOverview {
  orders: number
  units: number
  revenue: number
  avgOrderValue: number
  views: number
  conversionRate: number
  avgRating: number | null
  reviews: number
}

/** A single date bucket for a seller revenue/orders series. */
export interface SalesPoint {
  date: string
  total: number
  orders: number
}

export interface SellerCustomerAnalytics {
  totalBuyers: number
  repeatBuyers: number
  newBuyers: number
  repeatRate: number
  avgOrdersPerBuyer: number
  avgSpend: number
  avgOrderValue: number
}

export interface AdminMarketplaceKpis {
  gmv: number
  ordersCount: number
  unitsSold: number
  commissionTotal: number
  buyersTotal: number
  repeatBuyers: number
  newBuyers: number
  avgOrderValue: number
}

/** A single date bucket for the marketplace GMV/orders series. */
export interface AdminSalesPoint {
  date: string
  gmv: number
  orders: number
}

export interface TopSeller {
  storeId: string
  storeName: string
  gmv: number
  orders: number
}

export interface TopProduct {
  productId: string
  name: string
  gmv: number
  units: number
}

export interface TopCategory {
  categoryId: string | null
  name: string | null
  gmv: number
  units: number
}

export interface AdminCustomerAnalytics {
  totalBuyers: number
  repeatBuyers: number
  newBuyers: number
  repeatRate: number
  avgOrdersPerBuyer: number
  avgOrderValue: number
}
