import Image from 'next/image'
import Link from 'next/link'
import { requireUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { getFollowedStores } from '@/services/social-service'
import { Card, EmptyState, SectionTitle, Badge } from '@/components/ui'
import { UnfollowButton } from '@/components/features/social/unfollow-button'

export const metadata = {
  title: 'Toko yang Diikuti ',
}

export default async function FollowingPage() {
  await requireUser()
  const t = getDictionary()
  const stores = await getFollowedStores()

  return (
    <main className="container-wp py-10">
      <SectionTitle title={t.social.followingTitle} />

      {stores.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={t.social.noFollowing}
            action={
              <Link
                href="/search"
                className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
              >
                {t.social.browse} â†’
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((s) => (
            <Card key={s.storeId} className="flex items-center gap-3 p-4">
              <Link href={`/store/${s.slug}`} className="shrink-0">
                <div className="relative grid size-12 place-items-center overflow-hidden rounded-lg bg-brand-100 dark:bg-brand-900">
                  {s.logoUrl ? (
                    <Image
                      src={s.logoUrl}
                      alt={s.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <span className="text-sm font-bold text-brand-700 dark:text-brand-200">
                      {s.name[0]?.toUpperCase() ?? 'T'}
                    </span>
                  )}
                </div>
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/store/${s.slug}`}
                  className="block truncate font-semibold text-neutral-900 hover:text-brand-600 dark:text-neutral-50 dark:hover:text-brand-300"
                >
                  {s.name}
                </Link>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="neutral">
                    {s.ratingAvg > 0 ? `${s.ratingAvg.toFixed(1)}` : 'â€”'}
                  </Badge>
                </div>
              </div>
              <UnfollowButton storeId={s.storeId} label={t.social.following} />
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
