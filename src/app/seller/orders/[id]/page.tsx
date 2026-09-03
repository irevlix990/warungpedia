import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth/dal'
import { getSellerOrder } from '@/services/shipping-service'
import { ShipOrderForm } from '@/components/features/shipping/ship-order-form'
import { Card, Badge } from '@/components/ui'
import { formatIDR } from '@/utils/cn'

export const metadata: Metadata = {
  title: 'Detail Pesanan Penjual | Warungpedia',
}

interface SellerOrderPageProps {
  params: Promise<{ id: string }>
}

export default async function SellerOrderPage({
  params,
}: SellerOrderPageProps) {
  const t = getDictionary()
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')
  if (user.role === 'BUYER') redirect('/seller/apply')

  const order = await getSellerOrder(id)
  if (!order) notFound()

  const canShip = order.status === 'PAID' || order.status === 'PROCESSING'

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-500">{t.cart.orderNumber}</p>
            <p className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {order.id}
            </p>
          </div>
          <Badge variant="brand">{order.status}</Badge>
        </div>

        {canShip && <ShipOrderForm orderId={order.id} t={t.shipping} />}

        <h2 className="mt-6 font-display text-lg font-bold text-neutral-900 dark:text-neutral-50">
          {t.cart.items}
        </h2>
        <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {item.productName}
                </p>
                <p className="text-xs text-neutral-500">
                  {item.quantity} × {formatIDR(item.productPrice)}
                </p>
              </div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {formatIDR(item.productPrice * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-neutral-200 pt-3 text-base font-bold text-neutral-900 dark:border-neutral-700 dark:text-neutral-50">
          <span>{t.cart.total}</span>
          <span>{formatIDR(order.total)}</span>
        </div>
      </Card>
    </div>
  )
}