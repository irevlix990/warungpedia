'use client'

import { useActionState, useState } from 'react'
import { submitReviewAction } from '@/app/actions/social'
import { Button } from '@/components/ui/button'
import type { DictionarySocial } from '../auth/action-strings'

interface ReviewFormProps {
  productId: string
  orderId: string | null
  reviewId?: string
  initialRating?: number
  submitLabel: string
  t: DictionarySocial
  onDone?: () => void
}

export function ReviewForm({
  productId,
  orderId,
  reviewId,
  initialRating = 5,
  submitLabel,
  t,
  onDone,
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating)
  const [state, formAction, pending] = useActionState(submitReviewAction, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="orderId" value={orderId ?? ''} />
      {reviewId ? <input type="hidden" name="reviewId" value={reviewId} /> : null}
      <input type="hidden" name="rating" value={String(rating)} />

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            aria-label={`${i} ${t.rating}`}
            className="text-2xl"
          >
            <svg
              viewBox="0 0 20 20"
              fill={i <= rating ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.5"
              className={`h-7 w-7 ${i <= rating ? 'text-amber-500' : 'text-neutral-300 dark:text-neutral-600'}`}
            >
              <path d="M10 1.5l2.57 5.21 5.75.84-4.16 4.05.98 5.72L10 14.77l-5.14 2.55.98-5.72-4.16-4.05 5.75-.84L10 1.5z" />
            </svg>
          </button>
        ))}
      </div>

      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {t.reviewTitle}
        <input
          name="title"
          maxLength={120}
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus-visible:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </label>

      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {t.reviewBody}
        <textarea
          name="body"
          required
          rows={4}
          maxLength={2000}
          placeholder={t.reviewBodyPlaceholder}
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus-visible:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </label>

      {state?.errors?.rating ? (
        <p className="text-sm text-danger-600 dark:text-danger-400">
          {state.errors.rating[0]}
        </p>
      ) : null}
      {state?.errors?.body ? (
        <p className="text-sm text-danger-600 dark:text-danger-400">
          {state.errors.body[0]}
        </p>
      ) : null}
      {state?.message ? (
        <p className="text-sm text-danger-600 dark:text-danger-400">
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {submitLabel}
        </Button>
        {onDone ? (
          <Button type="button" variant="ghost" onClick={onDone}>
            {t.cancel}
          </Button>
        ) : null}
      </div>
    </form>
  )
}
