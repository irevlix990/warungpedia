import { SELLER_BADGE_LABELS, type SellerBadge } from '@/types/store'

const BADGE_STYLES: Record<SellerBadge, string> = {
  OFFICIAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  MALL: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  STAR: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
}

const BADGE_ICONS: Record<SellerBadge, string> = {
  OFFICIAL: '🏅',
  MALL: '🏬',
  STAR: '⭐',
}

export function SellerBadgeDisplay({ badge }: { badge: SellerBadge | null }) {
  if (!badge) return null
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE_STYLES[badge]}`}
    >
      <span>{BADGE_ICONS[badge]}</span>
      {SELLER_BADGE_LABELS[badge]}
    </span>
  )
}
