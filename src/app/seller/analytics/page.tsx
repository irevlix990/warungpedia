import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth/dal'
import { getStoreByOwner } from '@/services/store-service'
import {
  getSellerOverview,
  getSellerSalesSeries,
  getSellerProductAnalytics,
  getSellerCustomerAnalytics,
} from '@/services/analytics-service'
import { analyticsRangeSchema } from '@/lib/validation/analytics'
import { resolveAnalyticsRange } from '@/utils/analytics'
import { formatIDR } from '@/utils/cn'
import { KpiCard, Card } from '@/components/ui'
import { RangeSelect } from '@/components/features/analytics/range-select'
import { LineTrend } from '@/components/features/analytics/line-trend'

export const metadata: Metadata = {
  title: 'Analitik ',
}

export default async function SellerAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const t = getDictionary()
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  if (user.role === 'BUYER') {
    return <p className="text-sm text-neutral-500">{t.seller.buyerUnavailable}</p>
  }

  const store = await getStoreByOwner(user.id).catch(() => null)
  if (!store || store.status !== 'ACTIVE') {
    return <p className="text-sm text-neutral-500">{t.seller.storeUnavailable}</p>
  }

  const raw = await searchParams
  const parsed = analyticsRangeSchema.safeParse(raw)
  const range = parsed.success ? parsed.data.range : ('30d' as const)
  const { from, to } = resolveAnalyticsRange(range)
  const fromIso = from.toISOString()
  const toIso = to.toISOString()

  const [overview, series, products, customers] = await Promise.all([
    getSellerOverview(store.id, fromIso, toIso),
    getSellerSalesSeries(store.id, fromIso, toIso),
    getSellerProductAnalytics(store.id, fromIso, toIso),
    getSellerCustomerAnalytics(store.id, fromIso, toIso),
  ])

  const periodLabel =
    range === '7d' ? t.analytics.last7 : range === '90d' ? t.analytics.last90 : t.analytics.last30

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
            {t.analytics.productAnalysis}
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            {t.analytics.overview}
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
        <KpiCard label={t.analytics.orders} value={String(overview.orders)} />
        <KpiCard label={t.analytics.units} value={String(overview.units)} />
        <KpiCard label={t.analytics.revenue} value={formatIDR(overview.revenue)} />
        <KpiCard label={t.analytics.avgOrderValue} value={formatIDR(overview.avgOrderValue)} />
        <KpiCard label={t.analytics.views} value={String(overview.views)} />
        <KpiCard label={t.analytics.conversion} value={`${overview.conversionRate}%`} />
        <KpiCard
          label={t.analytics.avgRating}
          value={overview.avgRating == null ? 'â€”' : String(Number(overview.avgRating).toFixed(2))}
        />
        <KpiCard label={t.analytics.reviews} value={String(overview.reviews)} />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
            {t.analytics.revenueTrend}
          </h3>
          <span className="text-xs text-neutral-500">
            {t.analytics.period}: {periodLabel}
          </span>
        </div>
        {series.every((s) => s.total === 0) ? (
          <p className="py-8 text-center text-sm text-neutral-500">
            {t.analytics.noSales}
          </p>
        ) : (
          <LineTrend data={series} dataKey="total" money />
        )}
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
          {t.analytics.productAnalysis}
        </h3>
        {products.length === 0 ? (
          <p className="py-4 text-sm text-neutral-500">{t.analytics.noData}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                  <th className="py-2 pr-4 font-medium">{t.product.products}</th>
                  <th className="py-2 pr-4 font-medium">{t.analytics.views}</th>
                  <th className="py-2 pr-4 font-medium">{t.analytics.orders}</th>
                  <th className="py-2 pr-4 font-medium">{t.analytics.units}</th>
                  <th className="py-2 font-medium">{t.analytics.revenue}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {products.map((p) => (
                  <tr key={p.productId}>
                    <td className="py-3 pr-4 font-medium text-neutral-900 dark:text-neutral-50">
                      {p.productName}
                    </td>
                    <td className="py-3 pr-4 text-neutral-600 dark:text-neutral-300">
                      {p.views}
                    </td>
                    <td className="py-3 pr-4 text-neutral-600 dark:text-neutral-300">
                      {p.ordersCount}
                    </td>
                    <td className="py-3 pr-4 text-neutral-600 dark:text-neutral-300">
                      {p.unitsSold}
                    </td>
                    <td className="py-3 font-semibold text-neutral-900 dark:text-neutral-50">
                      {formatIDR(p.revenueNet)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div>
        <h3 className="mb-3 font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
          {t.analytics.customers}
        </h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <KpiCard label={t.analytics.buyers} value={String(customers.totalBuyers)} />
          <KpiCard label={t.analytics.repeatBuyers} value={String(customers.repeatBuyers)} />
          <KpiCard label={t.analytics.newBuyers} value={String(customers.newBuyers)} />
          <KpiCard
            label={t.analytics.repeatRate}
            value={`${customers.repeatRate}%`}
          />
          <KpiCard
            label={t.analytics.avgOrdersPerBuyer}
            value={String(customers.avgOrdersPerBuyer)}
          />
          <KpiCard label={t.analytics.avgSpend} value={formatIDR(customers.avgSpend)} />
        </div>
      </div>
    </div>
  )
}
