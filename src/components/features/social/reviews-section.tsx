import { ReviewForm } from './review-form'
import { RatingStars } from './rating-stars'
import type { DictionarySocial } from '../auth/action-strings'
import type { ProductReview } from '@/types/social'

interface ReviewsSectionProps {
  productId: string
  reviews: ProductReview[]
  ratingAvg: number
  /** The acting user's own review for this product, if any. */
  myReview: ProductReview | null
  /** Order id of a completed order containing this product (reviewable). */
  reviewableOrderId: string | null
  /** Whether the acting user is signed in. */
  isAuthed: boolean
  t: DictionarySocial
}

export function ReviewsSection({
  productId,
  reviews,
  ratingAvg,
  myReview,
  reviewableOrderId,
  isAuthed,
  t,
}: ReviewsSectionProps) {
  return (
    <section className="mt-12">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {t.reviews}
        </h2>
        {ratingAvg > 0 && (
          <div className="flex items-center gap-2">
            <RatingStars rating={ratingAvg} />
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              {ratingAvg.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {myReview ? (
        <div className="mt-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {t.updateReview}
          </p>
          <div className="mt-2">
            <ReviewForm
              productId={productId}
              orderId={null}
              reviewId={myReview.id}
              initialRating={myReview.rating}
              submitLabel={t.save}
              t={t}
            />
          </div>
        </div>
      ) : reviewableOrderId && isAuthed ? (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {t.writeReview}
          </p>
          <div className="mt-2">
            <ReviewForm
              productId={productId}
              orderId={reviewableOrderId}
              submitLabel={t.submit}
              t={t}
            />
          </div>
        </div>
      ) : isAuthed && !reviewableOrderId && !myReview ? (
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          {t.reviewPending}
        </p>
      ) : null}

      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          {t.noReviews}
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {r.authorName}
                </p>
                <RatingStars rating={r.rating} size="sm" />
              </div>
              {r.title ? (
                <p className="mt-1 text-sm font-medium text-neutral-800 dark:text-neutral-100">
                  {r.title}
                </p>
              ) : null}
              <p className="mt-1 whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-300">
                {r.body}
              </p>
              <p className="mt-2 text-xs text-neutral-400">
                {t.purchased} ·{' '}
                {new Date(r.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
