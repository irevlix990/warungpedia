import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n'
import { getAdminReviews } from '@/services/admin-service'
import { Card, EmptyState, Badge } from '@/components/ui'
import ReviewModerationActions from '@/components/features/admin/review-moderation-actions'

export const metadata: Metadata = {
  title: 'Ulasan | Admin ',
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const t = getDictionary().admin
  const { status: statusParam } = await searchParams
  const status = statusParam === 'HIDDEN' ? 'HIDDEN' : statusParam === 'ACTIVE' ? 'ACTIVE' : undefined
  const reviews = await getAdminReviews(status)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
            {t.reviews}
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            {t.reviewsSubtitle}
          </p>
        </div>
        <form method="get" className="flex items-center gap-2">
          <select
            name="status"
            defaultValue={status ?? ''}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="">{t.allStatuses}</option>
            <option value="ACTIVE">{t.active}</option>
            <option value="HIDDEN">{t.inactive}</option>
          </select>
        </form>
      </div>

      {reviews.length === 0 ? (
        <EmptyState title={t.noReviews} />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={review.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {review.status}
                    </Badge>
                    <span className="text-sm font-semibold text-brand-600 dark:text-brand-300">
                      {'â˜…'.repeat(review.rating)}
                      <span className="text-neutral-300 dark:text-neutral-600">
                        {'â˜…'.repeat(5 - review.rating)}
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {review.productName ?? review.productId}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {review.authorName} Â· {review.title ?? 'â€”'}
                  </p>
                  <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
                    {review.body}
                  </p>
                </div>
                <ReviewModerationActions
                  reviewId={review.id}
                  status={review.status}
                  labels={{ hide: t.hide, restore: t.restore }}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
