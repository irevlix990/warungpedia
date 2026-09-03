import { requireUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { getMyWishlists } from '@/services/social-service'
import { Card, EmptyState, SectionTitle } from '@/components/ui'
import { CreateWishlistForm } from '@/components/features/social/create-wishlist-form'
import Link from 'next/link'

export default async function WishlistPage() {
  await requireUser()
  const t = getDictionary()
  const wishlists = await getMyWishlists()

  return (
    <main className="container-wp py-10">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <SectionTitle title={t.social.myWishlist} />
        <div className="w-full sm:w-80">
          <CreateWishlistForm t={t.social} />
        </div>
      </div>

      {wishlists.length === 0 ? (
        <EmptyState
          title={t.social.emptyWishlist}
          action={
            <Link
              href="/search"
              className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
            >
              {t.social.browse} →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wishlists.map((wl) => (
            <Link key={wl.id} href={`/wishlist/${wl.id}`}>
              <Card className="p-5 transition-shadow hover:shadow-card">
                <p className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
                  {wl.name}
                </p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {wl.itemCount} {t.social.items}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
