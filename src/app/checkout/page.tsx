import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth/dal'
import { getCartForUser } from '@/services/cart-service'
import { Card, EmptyState } from '@/components/ui'
import { CheckoutSummary } from '@/components/features/cart/checkout-summary'
import { CartCheckoutLines } from '@/components/features/cart/checkout-lines'
import { cartTotals } from '@/utils/cart'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Selesaikan pesanan Anda di Warungpedia.',
}

export default async function CheckoutPage() {
  const t = getDictionary()
  const user = await getCurrentUser().catch(() => null)
  if (!user) redirect('/auth/signin?next=/checkout')

  const cart = await getCartForUser().catch(() => null)
  if (!cart || cart.items.length === 0) {
    return (
      <main className="container-wp py-10">
        <Card className="mt-8 p-6">
          <EmptyState
            title={t.cart.empty}
            description={t.cart.cartEmptyCheckout}
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
      </main>
    )
  }

  const totals = cartTotals(cart.subtotal)

  return (
    <main className="container-wp py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
        {t.cart.checkoutTitle}
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CartCheckoutLines cart={cart} t={t.cart} />
        </div>
        <aside>
          <CheckoutSummary totals={totals} t={t.cart} promo={t.promotions} />
        </aside>
      </div>
    </main>
  )
}
