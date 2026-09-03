import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth/dal'
import { getSellerOrders } from '@/services/shipping-service'
import { Card, Badge, EmptyState } from '@/components/ui'
import { formatIDR } from '@/utils/cn'

export const metadata: Metadata = {
  title: 'Pesanan Penjual ',
}

const statusVariant: Record<string, 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  PENDING: 'warning',
  PAID: 'brand',
  PROCESSING: 'brand',
  SHIPPED: 'info',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

export default async function SellerOrdersPage() {
  const t = getDictionary()
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')
  if (user.role === 'BUYER') redirect('/seller/apply')

  const orders = await getSellerOrders().catch(() => [])

  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-50">
        {t.shipping.title}
      </h2>
      {orders.length === 0 ? (
        <EmptyState title={t.shipping.noOrders} />
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-5">
              <Link href={`/seller/orders/${order.id}`} className="block">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      {order.id}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {new Date(order.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <Badge variant={statusVariant[order.status] ?? 'neutral'}>
                    {order.status}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
                  {formatIDR(order.total)} Â· {order.items.length} item
                </p>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}