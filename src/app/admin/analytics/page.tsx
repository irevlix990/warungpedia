import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n'
import {
  getAdminMarketplaceKpis,
  getAdminSalesSeries,
  getAdminTopSellers,
  getAdminTopProducts,
  getAdminTopCategories,
  getAdminCustomerAnalytics,
} from '@/services/analytics-service'
import { analyticsRangeSchema } from '@/lib/validation/analytics'
import { resolveAnalyticsRange } from '@/utils/analytics'
import { formatIDR } from '@/utils/cn'
import { KpiCard, Card } from '@/components/ui'
import { RangeSelect } from '@/components/features/analytics/range-select'
import { LineTrend } from '@/components/features/analytics/line-trend'
import { RankList } from '@/components/features/analytics/rank-list'

export const metadata: Metadata = {
  title: 'Analitik | Admin ',
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const t = getDictionary()
  const raw = await searchParams
  const parsed = analyticsRangeSchema.safeParse(raw)
  const range = parsed.success ? parsed.data.range : ('30d' as const)
  const { from, to } = resolveAnalyticsRange(range)
  const fromIso = from.toISOString()
  const toIso = to.toISOString()

  const [kpis, series, topSellers, topProducts, topCategories, customers] =
    await Promise.all([
      getAdminMarketplaceKpis(fromIso, toIso),
      getAdminSalesSeries(fromIso, toIso),
      getAdminTopSellers(fromIso, toIso),
      getAdminTopProducts(fromIso, toIso),
      getAdminTopCategories(fromIso, toIso),
      getAdminCustomerAnalytics(fromIso, toIso),
    ])

  const periodLabel =
    range === '7d' ? t.analytics.last7 : range === '90d' ? t.analytics.last90 : t.analytics.last30

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
            {t.analytics.title}
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            {t.analytics.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">{t.analytics.range}</span>
          <RangeSelect
            value={range}
            className="w-44"
            labels={{
              last7: t.analytics.last7,
              last30: t.analytics.last30,
              last90: t.analytics.last90,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label={t.analytics.gmv} value={formatIDR(kpis.gmv)} />
        <KpiCard label={t.analytics.orders} value={String(kpis.ordersCount)} />
        <KpiCard label={t.analytics.units} value={String(kpis.unitsSold)} />
        <KpiCard label={t.analytics.commission} value={formatIDR(kpis.commissionTotal)} />
        <KpiCard label={t.analytics.avgOrderValue} value={formatIDR(kpis.avgOrderValue)} />
        <KpiCard label={t.analytics.buyers} value={String(kpis.buyersTotal)} />
        <KpiCard label={t.analytics.repeatBuyers} value={String(kpis.repeatBuyers)} />
        <KpiCard label={t.analytics.newBuyers} value={String(kpis.newBuyers)} />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
            {t.analytics.gmvTrend}
          </h3>
          <span className="text-xs text-neutral-500">
            {t.analytics.period}: {periodLabel}
          </span>
        </div>
        {series.every((s) => s.gmv === 0) ? (
          <p className="py-8 text-center text-sm text-neutral-500">
            {t.analytics.noSales}
          </p>
        ) : (
          <LineTrend data={series} dataKey="gmv" money />
        )}
      </Card>

      <div>
        <h3 className="mb-3 font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
          {t.analytics.customers}
        </h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <KpiCard label={t.analytics.buyers} value={String(customers.totalBuyers)} />
          <KpiCard label={t.analytics.repeatBuyers} value={String(customers.repeatBuyers)} />
          <KpiCard label={t.analytics.newBuyers} value={String(customers.newBuyers)} />
          <KpiCard label={t.analytics.repeatRate} value={`${customers.repeatRate}%`} />
          <KpiCard
            label={t.analytics.avgOrdersPerBuyer}
            value={String(customers.avgOrdersPerBuyer)}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="mb-3 font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
            {t.analytics.topSellers}
          </h3>
          <RankList
            maxValue={Math.max(1, ...topSellers.map((s) => s.gmv))}
            items={topSellers.map((s) => ({
              id: s.storeId,
              name: s.storeName,
              value: formatIDR(s.gmv),
              accent: s.gmv,
            }))}
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
            {t.analytics.topProducts}
          </h3>
          <RankList
            maxValue={Math.max(1, ...topProducts.map((p) => p.gmv))}
            items={topProducts.map((p) => ({
              id: p.productId,
              name: p.name,
              value: `${p.units} Ã—`,
              accent: p.gmv,
            }))}
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
            {t.analytics.topCategories}
          </h3>
          <RankList
            maxValue={Math.max(1, ...topCategories.map((c) => c.gmv))}
            items={topCategories.map((c) => ({
              id: c.categoryId ?? 'uncategorized',
              name: c.name ?? 'Tanpa kategori',
              value: formatIDR(c.gmv),
              accent: c.gmv,
            }))}
          />
        </Card>
      </div>
    </div>
  )
}
