import { BUYER_BADGE_LABELS, type BuyerBadge } from '@/types/payment'

const BADGE_STYLES: Record<BuyerBadge, string> = {
  BRONZE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  SILVER: 'bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-300',
  GOLD: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  PLATINUM: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  VIP: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
}

const BADGE_ICONS: Record<BuyerBadge, string> = {
  BRONZE: '🥉',
  SILVER: '🥈',
  GOLD: '🥇',
  PLATINUM: '💎',
  VIP: '👑',
}

export function BuyerBadgeDisplay({ badge }: { badge: BuyerBadge | null }) {
  if (!badge) return null
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE_STYLES[badge]}`}
    >
      <span>{BADGE_ICONS[badge]}</span>
      {BUYER_BADGE_LABELS[badge]}
    </span>
  )
}
