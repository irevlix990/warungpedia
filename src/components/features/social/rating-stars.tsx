interface RatingStarsProps {
  rating: number
  size?: 'sm' | 'md'
}

/** Renders 1–5 star glyphs reflecting a numeric 0–5 rating (server-safe). */
export function RatingStars({ rating, size = 'md' }: RatingStarsProps) {
  const rounded = Math.round(rating)
  const span = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const text = size === 'sm' ? 'text-xs' : 'text-sm'
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${text} text-amber-500`}
      aria-label={`${rating.toFixed(1)}/5`}
      role="img"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill={i <= rounded ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
          className={span}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.57 5.21 5.75.84-4.16 4.05.98 5.72L10 14.77l-5.14 2.55.98-5.72-4.16-4.05 5.75-.84L10 1.5z" />
        </svg>
      ))}
    </span>
  )
}
