import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth/dal'
import { getCartForUser } from '@/services/cart-service'
import { CartList } from '@/components/features/cart/cart-list'
import { CartSummary } from '@/components/features/cart/cart-summary'
import { Card, EmptyState, SectionTitle } from '@/components/ui'
import { cartTotals } from '@/utils/cart'

export const metadata: Metadata = {
  title: 'Keranjang Belanja',
  description: 'Keranjang belanja Anda di Warungpedia.',
}

export default async function CartPage() {
  const t = getDictionary()
  const user = await getCurrentUser().catch(() => null)
  if (!user) redirect('/auth/signin?next=/cart')

  const cart = await getCartForUser().catch(() => ({
    items: [] as never[],
    itemCount: 0,
    subtotal: 0,
  }))
  const totals = cartTotals(cart.subtotal ?? 0)

  return (
    <main className="container-wp py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
        {t.cart.title}
      </h1>

      {cart.items.length === 0 ? (
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
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionTitle title={t.cart.itemCount.replace('{count}', String(cart.itemCount))} />
            <div className="mt-4">
              <CartList cart={cart} t={t.cart} />
            </div>
          </div>
          <aside>
            <CartSummary totals={totals} hasItems t={t.cart} />
          </aside>
        </div>
      )}
    </main>
  )
}
