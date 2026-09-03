import type { Metadata } from 'next'
import Link from 'next/link'
import { getDictionary } from '@/lib/i18n'
import { getAdminOrders } from '@/services/admin-service'
import { Card, EmptyState, Badge, Button } from '@/components/ui'
import { formatIDR } from '@/utils/cn'
import type { OrderStatus } from '@/types/admin'

export const metadata: Metadata = {
  title: 'Pesanan | Admin ',
}

const statusVariant: Record<string, 'brand' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  PENDING: 'warning',
  PAID: 'brand',
  PROCESSING: 'brand',
  SHIPPED: 'brand',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

const STATUSES: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
]

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const t = getDictionary().admin
  const { status: statusParam } = await searchParams
  const status = STATUSES.includes(statusParam as OrderStatus)
    ? (statusParam as OrderStatus)
    : undefined
  const orders = await getAdminOrders(status)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
            {t.orders}
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            {t.ordersSubtitle}
          </p>
        </div>
        <form method="get" className="flex items-center gap-2">
          <select
            name="status"
            defaultValue={status ?? ''}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="">{t.allStatuses}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </form>
      </div>

      {orders.length === 0 ? (
        <EmptyState title={t.noOrders} />
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {order.id.slice(0, 12)}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {order.buyerName ?? 'â€”'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {new Date(order.createdAt).toLocaleString('id-ID')} Â·{' '}
                    {order.itemCount} {t.items}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariant[order.status] ?? 'neutral'}>
                    {order.status}
                  </Badge>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-50">
                    {formatIDR(order.total)}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Link href={`/admin/orders/${order.id}`}>
                  <Button variant="outline" size="sm">
                    {t.view}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
