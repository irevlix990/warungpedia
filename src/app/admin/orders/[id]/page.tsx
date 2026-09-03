import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { requirePermission } from '@/lib/auth/dal'
import { getOrderById } from '@/services/cart-service'
import { Card, Badge } from '@/components/ui'
import { formatIDR } from '@/utils/cn'

export const metadata: Metadata = {
  title: 'Detail Pesanan | Admin | Warungpedia',
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

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = getDictionary().admin
  await requirePermission('MANAGE_ORDERS')
  const { id } = await params
  const order = await getOrderById(id)
  if (!order) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
          >
            ← {t.orders}
          </Link>
          <h2 className="mt-1 font-mono text-xl font-bold text-neutral-900 dark:text-neutral-50">
            {order.id}
          </h2>
        </div>
        <Badge variant={statusVariant[order.status] ?? 'neutral'}>
          {order.status}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold text-neutral-500">{t.total}</p>
          <p className="mt-1 font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {formatIDR(order.total)}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            {t.buyer}: {order.userId.slice(0, 12)}
          </p>
          <p className="text-xs text-neutral-500">
            {new Date(order.createdAt).toLocaleString('id-ID')}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-neutral-500">{t.items}</p>
          <p className="mt-1 font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {order.items.length}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            {t.status}: {order.status}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {item.productName}
                </p>
                <p className="text-xs text-neutral-500">
                  {item.quantity} × {formatIDR(item.productPrice)}
                </p>
              </div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                {formatIDR(item.productPrice * item.quantity)}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-1 p-4 text-sm text-neutral-600 dark:text-neutral-300">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatIDR(order.subtotal)}</span>
          </p>
          <p className="flex justify-between">
            <span>Shipping</span>
            <span>{formatIDR(order.shippingFee)}</span>
          </p>
          <p className="flex justify-between">
            <span>Discount</span>
            <span>-{formatIDR(order.discount)}</span>
          </p>
          <p className="flex justify-between font-semibold text-neutral-900 dark:text-neutral-50">
            <span>{t.total}</span>
            <span>{formatIDR(order.total)}</span>
          </p>
        </div>
      </Card>
    </div>
  )
}
