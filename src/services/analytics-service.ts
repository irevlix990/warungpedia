import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import type {
  AdminCustomerAnalytics,
  AdminMarketplaceKpis,
  AdminSalesPoint,
  SalesPoint,
  SellerCustomerAnalytics,
  SellerOverview,
  SellerProductAnalytics,
  TopCategory,
  TopProduct,
  TopSeller,
} from '@/types/analytics'
import { completeDailySeries, dayKey } from '@/utils/analytics'

const COMMITTED: OrderRow['status'][] = [
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
]

type SellerOverviewRow =
  Database['public']['Functions']['seller_overview']['Returns']
type SellerProductRow =
  Database['public']['Functions']['seller_product_analytics']['Returns']
type SellerSeriesRow =
  Database['public']['Functions']['seller_sales_series']['Returns']
type SellerCustomerRow =
  Database['public']['Functions']['seller_customer_analytics']['Returns']
type MarketRow =
  Database['public']['Functions']['admin_marketplace_analytics']['Returns']

type OrderRow = Database['public']['Tables']['orders']['Row']
type OrderItemRow = Database['public']['Tables']['order_items']['Row']

/** RPC `returns table` results are typed as a row but returned as an array. */
function rowOrFirst<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T) ?? null
  return (data as T) ?? null
}

function rowsOf<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  return data ? [data as T] : []
}

// ---------------------------------------------------------------------------
// Seller analytics
// ---------------------------------------------------------------------------

/** Seller: store KPI bundle for a window. */
export async function getSellerOverview(
  storeId: string,
  from: string,
  to: string
): Promise<SellerOverview> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('seller_overview', {
    p_store_id: storeId,
    p_from: from,
    p_to: to,
  })
  if (error) throw new Error(`Gagal memuat ringkasan: ${error.message}`)
  const row = rowOrFirst<SellerOverviewRow>(data)
  return {
    orders: row?.orders ?? 0,
    units: row?.units ?? 0,
    revenue: row?.revenue ?? 0,
    views: row?.views ?? 0,
    avgOrderValue: row?.avg_order_value ?? 0,
    conversionRate: Number(row?.conversion_rate ?? 0),
    avgRating: row?.avg_rating ?? null,
    reviews: row?.reviews ?? 0,
  }
}

/** Seller: daily revenue + committed-order series (zero-filled). */
export async function getSellerSalesSeries(
  storeId: string,
  from: string,
  to: string
): Promise<SalesPoint[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('seller_sales_series', {
    p_store_id: storeId,
    p_from: from,
    p_to: to,
  })
  if (error) throw new Error(`Gagal memuat deret penjualan: ${error.message}`)
  const rows = rowsOf<SellerSeriesRow>(data)
  return completeDailySeries(
    rows.map((r) => ({ date: r.day, total: r.revenue, orders: r.orders })),
    new Date(from),
    new Date(to),
    () => ({ total: 0, orders: 0 })
  )
}

/** Seller: per-product views / orders / units / revenue. */
export async function getSellerProductAnalytics(
  storeId: string,
  from: string,
  to: string
): Promise<SellerProductAnalytics[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('seller_product_analytics', {
    p_store_id: storeId,
    p_from: from,
    p_to: to,
  })
  if (error) throw new Error(`Gagal memuat analisis produk: ${error.message}`)
  return rowsOf<SellerProductRow>(data).map((r) => ({
    productId: r.product_id,
    productName: r.product_name,
    slug: r.slug,
    views: r.views,
    ordersCount: r.orders_count,
    unitsSold: r.units_sold,
    revenueNet: r.revenue_net,
  }))
}

/** Seller: customer analytics for a window. */
export async function getSellerCustomerAnalytics(
  storeId: string,
  from: string,
  to: string
): Promise<SellerCustomerAnalytics> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('seller_customer_analytics', {
    p_store_id: storeId,
    p_from: from,
    p_to: to,
  })
  if (error) throw new Error(`Gagal memuat analisis pelanggan: ${error.message}`)
  const r = rowOrFirst<SellerCustomerRow>(data)
  return {
    totalBuyers: r?.total_buyers ?? 0,
    repeatBuyers: r?.repeat_buyers ?? 0,
    newBuyers: r?.new_buyers ?? 0,
    repeatRate: Number(r?.repeat_rate ?? 0),
    avgOrdersPerBuyer: Number(r?.avg_orders_per_buyer ?? 0),
    avgSpend: r?.avg_spend ?? 0,
    avgOrderValue: r?.avg_order_value ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Admin analytics
// ---------------------------------------------------------------------------

interface AdminItem extends OrderItemRow {
  orderCreatedAt: string
  orderTotal: number
}

/** Admin: fetch committed order items within a window (admin RLS). */
async function fetchCommittedItems(from: string, to: string): Promise<AdminItem[]> {
  const supabase = await createClient()
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, total, created_at')
    .in('status', COMMITTED)
    .gte('created_at', from)
    .lt('created_at', to)
    .limit(5000)
  if (error) throw new Error(`Gagal memuat pesanan: ${error.message}`)
  const orderIds = (orders ?? []).map((o) => o.id)
  const map = new Map((orders ?? []).map((o) => [o.id, o]))
  if (orderIds.length === 0) return []
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds)
    .limit(20000)
  if (itemsError) throw new Error(`Gagal memuat item pesanan: ${itemsError.message}`)
  return (items ?? []).map((it) => {
    const order = map.get(it.order_id) as OrderRow | undefined
    return {
      ...it,
      orderCreatedAt: order?.created_at ?? it.created_at,
      orderTotal: order?.total ?? 0,
    }
  })
}

/** Admin: marketplace KPIs for a window. */
export async function getAdminMarketplaceKpis(
  from: string,
  to: string
): Promise<AdminMarketplaceKpis> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_marketplace_analytics', {
    p_from: from,
    p_to: to,
  })
  if (error) throw new Error(`Gagal memuat KPI pasar: ${error.message}`)
  const r = rowOrFirst<MarketRow>(data)
  return {
    gmv: r?.gmv ?? 0,
    ordersCount: r?.orders_count ?? 0,
    unitsSold: r?.units_sold ?? 0,
    commissionTotal: r?.commission_total ?? 0,
    buyersTotal: r?.buyers_total ?? 0,
    repeatBuyers: r?.repeat_buyers ?? 0,
    newBuyers: r?.new_buyers ?? 0,
    avgOrderValue: r?.avg_order_value ?? 0,
  }
}

/** Admin: marketplace daily GMV/orders series (zero-filled). */
export async function getAdminSalesSeries(
  from: string,
  to: string
): Promise<AdminSalesPoint[]> {
  const items = await fetchCommittedItems(from, to)
  const dayOrders = new Map<string, Set<string>>()
  const dayGmv = new Map<string, number>()
  for (const it of items) {
    const key = dayKey(new Date(it.orderCreatedAt))
    if (!dayOrders.has(key)) dayOrders.set(key, new Set())
    dayOrders.get(key)!.add(it.order_id)
    dayGmv.set(key, (dayGmv.get(key) ?? 0) + it.product_price * it.quantity)
  }
  const partial: AdminSalesPoint[] = []
  for (const key of dayOrders.keys()) {
    partial.push({
      date: key,
      gmv: dayGmv.get(key) ?? 0,
      orders: dayOrders.get(key)!.size,
    })
  }
  return completeDailySeries(partial, new Date(from), new Date(to), () => ({
    gmv: 0,
    orders: 0,
  }))
}

/** Admin: top sellers by GMV within a window. */
export async function getAdminTopSellers(
  from: string,
  to: string,
  limit = 10
): Promise<TopSeller[]> {
  const items = await fetchCommittedItems(from, to)
  const supabase = await createClient()
  const storeIds = Array.from(new Set(items.map((i) => i.store_id)))
  const names = new Map<string, string>()
  if (storeIds.length > 0) {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name')
      .in('id', storeIds)
    if (!error && data) for (const s of data) names.set(s.id, s.name)
  }
  const byStore = new Map<string, { gmv: number; orderIds: Set<string> }>()
  for (const it of items) {
    const b = byStore.get(it.store_id) ?? { gmv: 0, orderIds: new Set<string>() }
    b.gmv += it.product_price * it.quantity
    b.orderIds.add(it.order_id)
    byStore.set(it.store_id, b)
  }
  return Array.from(byStore.entries())
    .map(([storeId, b]) => ({
      storeId,
      storeName: names.get(storeId) ?? '—',
      gmv: b.gmv,
    orders: b.orderIds.size,
    }))
    .sort((a, b) => b.gmv - a.gmv)
    .slice(0, limit)
}

/** Admin: top products by GMV within a window. */
export async function getAdminTopProducts(
  from: string,
  to: string,
  limit = 10
): Promise<TopProduct[]> {
  const items = await fetchCommittedItems(from, to)
  const byProduct = new Map<string, { gmv: number; units: number; name: string }>()
  for (const it of items) {
    const pid = it.product_id ?? ''
    const cur = byProduct.get(pid) ?? { gmv: 0, units: 0, name: it.product_name }
    cur.gmv += it.product_price * it.quantity
    cur.units += it.quantity
    cur.name = it.product_name
    byProduct.set(pid, cur)
  }
  return Array.from(byProduct.entries())
    .map(([productId, p]) => ({
      productId,
      name: p.name || 'Produk dihapus',
      gmv: p.gmv,
      units: p.units,
    }))
    .sort((a, b) => b.gmv - a.gmv)
    .slice(0, limit)
}

/** Admin: top categories by GMV within a window. */
export async function getAdminTopCategories(
  from: string,
  to: string,
  limit = 10
): Promise<TopCategory[]> {
  const items = await fetchCommittedItems(from, to)
  const supabase = await createClient()
  const productIds = Array.from(
    new Set(items.map((i) => i.product_id).filter((p): p is string => Boolean(p)))
  )
  const catByProduct = new Map<string, string | null>()
  if (productIds.length > 0) {
    const { data, error } = await supabase
      .from('products')
      .select('id, category_id')
      .in('id', productIds)
    if (!error && data) {
      for (const p of data) catByProduct.set(p.id, p.category_id)
    }
  }
  const catIds = Array.from(new Set(catByProduct.values().filter((c): c is string => Boolean(c))))
  const catNames = new Map<string, string>()
  if (catIds.length > 0) {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', catIds)
    if (!error && data) for (const c of data) catNames.set(c.id, c.name)
  }
  const byCat = new Map<string, { gmv: number; units: number }>()
  for (const it of items) {
    const catId = it.product_id ? catByProduct.get(it.product_id) ?? null : null
    const key = catId ?? ''
    const cur = byCat.get(key) ?? { gmv: 0, units: 0 }
    cur.gmv += it.product_price * it.quantity
    cur.units += it.quantity
    byCat.set(key, cur)
  }
  return Array.from(byCat.entries())
    .map(([categoryId, c]) => ({
      categoryId: categoryId || null,
      name: categoryId ? catNames.get(categoryId) ?? '—' : 'Tanpa kategori',
      gmv: c.gmv,
      units: c.units,
    }))
    .sort((a, b) => b.gmv - a.gmv)
    .slice(0, limit)
}

/** Admin: customer analytics derived from marketplace KPIs. */
export async function getAdminCustomerAnalytics(
  from: string,
  to: string
): Promise<AdminCustomerAnalytics> {
  const kpis = await getAdminMarketplaceKpis(from, to)
  const repeatRate =
    kpis.buyersTotal > 0
      ? Math.round((kpis.repeatBuyers / kpis.buyersTotal) * 10000) / 100
      : 0
  const avgOrdersPerBuyer =
    kpis.buyersTotal > 0
      ? Math.round((kpis.ordersCount / kpis.buyersTotal) * 100) / 100
      : 0
  return {
    totalBuyers: kpis.buyersTotal,
    repeatBuyers: kpis.repeatBuyers,
    newBuyers: kpis.newBuyers,
    repeatRate,
    avgOrdersPerBuyer,
    avgOrderValue: kpis.avgOrderValue,
  }
}
