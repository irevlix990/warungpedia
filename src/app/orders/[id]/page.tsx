import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth/dal'
import { getOrderById } from '@/services/cart-service'
import {
  getReturnsForOrder,
  getReturnReasons,
  getShipmentForOrder,
} from '@/services/shipping-service'
import { PayOrderForm } from '@/components/features/payment/pay-order-form'
import { OpenChatButton } from '@/components/features/communication/open-chat-button'
import { ConfirmReceiptButton } from '@/components/features/shipping/confirm-receipt-button'
import { ReturnForm } from '@/components/features/shipping/return-form'
import { EscalateDisputeForm } from '@/components/features/shipping/escalate-dispute-form'
import { Card, Badge } from '@/components/ui'
import { formatIDR } from '@/utils/cn'

interface OrderPageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Pesanan',
  description: 'Detail pesanan Anda di Warungpedia.',
}

const returnVariant: Record<string, 'warning' | 'success' | 'danger' | 'brand' | 'neutral'> = {
  REQUESTED: 'warning',
  APPROVED: 'brand',
  REFUNDED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
}

export default async function OrderPage({ params }: OrderPageProps) {
  const t = getDictionary()
  const { id } = await params
  const user = await getCurrentUser().catch(() => null)
  const order = user ? await getOrderById(id).catch(() => null) : null
  if (!order) notFound()

  const isBuyer = order.userId === user?.id
  const [returns, shipment, reasons] = await Promise.all([
    getReturnsForOrder(id).catch(() => []),
    getShipmentForOrder(id).catch(() => null),
    getReturnReasons().catch(() => []),
  ])

  const returnByItem = new Map(returns.map((r) => [r.orderItemId, r]))
  const canReturn = order.status === 'COMPLETED'

  return (
    <main className="container-wp py-10">
      <div className="rounded-2xl border border-success-200 bg-success-50 p-6 dark:border-success-900 dark:bg-success-900/20">
        <h1 className="font-display text-3xl font-extrabold text-success-700 dark:text-success-200">
          {t.cart.orderSuccess}
        </h1>
        <p className="mt-2 text-sm text-success-700/80 dark:text-success-200/80">
          {t.cart.orderSuccessDesc}
        </p>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t.cart.orderNumber}
                </p>
                <p className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {order.id}
                </p>
              </div>
              <Badge variant="brand">
                {order.status === 'PENDING' ? t.cart.statusPending : order.status}
              </Badge>
            </div>

            {order.status === 'PENDING' && isBuyer ? (
              <PayOrderForm orderId={order.id} t={t.cart} />
            ) : order.status === 'SHIPPED' && isBuyer ? (
              <div className="mt-4">
                <ConfirmReceiptButton orderId={order.id} t={t.shipping} />
              </div>
            ) : null}

            {shipment && (
              <div className="mt-4 rounded-xl border border-neutral-200 p-4 text-sm dark:border-neutral-800">
                <p className="font-semibold text-neutral-900 dark:text-neutral-50">
                  {t.shipping.tracking}
                </p>
                <p className="mt-1 text-neutral-600 dark:text-neutral-300">
                  {shipment.carrier} · {shipment.trackingNumber}
                </p>
              </div>
            )}

            <h2 className="mt-6 font-display text-lg font-bold text-neutral-900 dark:text-neutral-50">
              {t.cart.items}
            </h2>
            <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
              {order.items.map((item) => {
                const r = returnByItem.get(item.id)
                return (
                  <li key={item.id} className="py-3">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {item.productName}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {item.quantity} × {formatIDR(item.productPrice)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatIDR(item.productPrice * item.quantity)}
                      </p>
                    </div>
                    {isBuyer && canReturn && reasons.length > 0 && !r && (
                      <ReturnForm
                        orderId={order.id}
                        orderItemId={item.id}
                        itemName={item.productName}
                        reasons={reasons}
                        t={t.shipping}
                      />
                    )}
                    {r && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant={returnVariant[r.status] ?? 'neutral'}>
                          {t.shipping.returnStatus}: {r.status}
                        </Badge>
                        {r.refundAmount !== null && (
                          <span className="text-xs text-neutral-500">
                            {t.shipping.refundAmount}: {formatIDR(r.refundAmount)}
                          </span>
                        )}
                        {r.sellerNote && (
                          <span className="text-xs text-neutral-500">
                            {t.shipping.sellerNote}: {r.sellerNote}
                          </span>
                        )}
                        {r.status === 'REJECTED' && (
                          <EscalateDisputeForm returnId={r.id} t={t.shipping} />
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>

          {isBuyer && canReturn && (
            <p className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
              {t.shipping.confirmReceiptHint}
            </p>
          )}
        </div>

        <Card className="h-fit p-5">
          <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-50">
            {t.cart.total}
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
              <dt>{t.cart.subtotal}</dt>
              <dd>{formatIDR(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
              <dt>{t.cart.shippingFee}</dt>
              <dd>
                {order.shippingFee === 0
                  ? t.cart.freeShipping
                  : formatIDR(order.shippingFee)}
              </dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <dt>{t.promotions.appliedDiscount}</dt>
                <dd>-{formatIDR(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-bold text-neutral-900 dark:border-neutral-700 dark:text-neutral-50">
              <dt>{t.cart.total}</dt>
              <dd>{formatIDR(order.total)}</dd>
            </div>
          </dl>
          <Link
            href="/search"
            className="mt-5 block text-center text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
          >
            {t.cart.continueShoppingAfter}
          </Link>
          <div className="mt-3">
            <OpenChatButton orderId={order.id} t={t.communication} />
          </div>
        </Card>
      </div>
    </main>
  )
}