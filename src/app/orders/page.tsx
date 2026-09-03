import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth/dal'
import { getOrdersForUser } from '@/services/cart-service'
import { Card, EmptyState, Badge } from '@/components/ui'
import { formatIDR } from '@/utils/cn'

export const metadata: Metadata = {
  title: 'Pesanan Saya',
  description: 'Daftar pesanan Anda di Warungpedia.',
}

export default async function OrdersPage() {
  const t = getDictionary()
  const user = await getCurrentUser().catch(() => null)
  if (!user) redirect('/auth/signin?next=/orders')

  const orders = await getOrdersForUser().catch(() => [])

  return (
    <main className="container-wp py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
        {t.nav.orders}
      </h1>

      {orders.length === 0 ? (
        <Card className="mt-8 p-6">
          <EmptyState
            title={t.cart.empty}
            description={t.cart.emptyHint}
            action={
              <Link
                href="/search"
                className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
              >
                {t.cart.continueShopping}
              </Link>
            }
          />
        </Card>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="block rounded-xl border border-neutral-200 p-5 transition-colors hover:border-brand-400 dark:border-neutral-800 dark:hover:border-brand-600"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      {order.id}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {order.items.reduce((sum, i) => sum + i.quantity, 0)}{' '}
                      item · {formatIDR(order.total)}
                    </p>
                  </div>
                  <Badge variant="brand">
                    {order.status === 'PENDING'
                      ? t.cart.statusPending
                      : order.status}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
