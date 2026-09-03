import type { Metadata } from 'next'
import Link from 'next/link'
import { getDictionary } from '@/lib/i18n'
import { getAdminStats } from '@/services/admin-service'
import { Card, Badge, buttonVariants } from '@/components/ui'
import { formatIDR } from '@/utils/cn'
import type { AdminStats } from '@/types/admin'

export const metadata: Metadata = {
  title: 'Dashboard | Admin ',
}

interface Kpi {
  key: keyof AdminStats
  label: string
  format?: (value: number) => string
  href?: string
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href?: string
}) {
  const inner = (
    <Card className="p-5">
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50">
        {value}
      </p>
    </Card>
  )
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  )
}

export default async function AdminDashboardPage() {
  const t = getDictionary()
  const stats = await getAdminStats()

  const primary: Kpi[] = [
    { key: 'gmv', label: t.admin.stats.gmv, format: (v) => formatIDR(v) },
    { key: 'committedOrders', label: t.admin.stats.committedOrders },
    { key: 'totalUsers', label: t.admin.stats.users },
    { key: 'totalStores', label: t.admin.stats.stores },
    { key: 'activeProducts', label: t.admin.stats.activeProducts },
    { key: 'pendingWithdrawals', label: t.admin.stats.pendingWithdrawals },
  ]

  const market: Kpi[] = [
    { key: 'totalBuyers', label: t.admin.stats.buyers },
    { key: 'totalSellers', label: t.admin.stats.sellers },
    { key: 'totalAdmins', label: t.admin.stats.admins },
    { key: 'activeStores', label: t.admin.stats.activeStores },
    { key: 'totalProducts', label: t.admin.stats.products },
    { key: 'totalOrders', label: t.admin.stats.orders },
  ]

  const queued: Kpi[] = [
    { key: 'pendingStores', label: t.admin.stats.pendingStores, href: '/admin/stores' },
    { key: 'pendingWithdrawals', label: t.admin.stats.pendingWithdrawals, href: '/admin/withdrawals' },
    { key: 'openDisputes', label: t.admin.stats.openDisputes, href: '/admin/disputes' },
    { key: 'pendingReturns', label: t.admin.stats.pendingReturns },
    { key: 'hiddenReviews', label: t.admin.stats.hiddenReviews, href: '/admin/reviews' },
  ]

  const renderKpis = (list: Kpi[]) =>
    list.map((k) => (
      <StatCard
        key={k.key}
        label={k.label}
        value={k.format ? k.format(stats[k.key]) : String(stats[k.key])}
        href={k.href}
      />
    ))

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {t.admin.dashboard}
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          {t.admin.dashboardSubtitle}
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
          {t.admin.stats.gmv} &amp; {t.admin.stats.orders}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {renderKpis(primary)}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
          {t.admin.groups.overview}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {renderKpis(market)}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
            {t.admin.needsAttention}
          </h3>
          <Badge variant="warning">{t.admin.approvalPending}</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {renderKpis(queued)}
        </div>
      </section>

      <section>
        <Card className="p-5">
          <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
            Hak akses
          </h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Gunakan menu di atas untuk mengelola toko, produk, kategori, ulasan,
            pesanan, penarikan, dan konten situs.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin/products" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              {t.admin.products}
            </Link>
            <Link href="/admin/users" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              {t.admin.users}
            </Link>
            <Link href="/admin/cms" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              {t.admin.cms}
            </Link>
          </div>
        </Card>
      </section>
    </div>
  )
}
