/**
 * Category emoji and color mapping for visual richness across the marketplace.
 */
export interface CategoryVisual {
  emoji: string
  colorClass: string
  bgLight: string
  bgDark: string
}

export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  elektronik: {
    emoji: '📱',
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-950/40',
  },
  'elektronik-hp-tablet': {
    emoji: '📱',
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-950/40',
  },
  'elektronik-laptop-komputer': {
    emoji: '💻',
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgLight: 'bg-indigo-50',
    bgDark: 'dark:bg-indigo-950/40',
  },
  fashion: {
    emoji: '👕',
    colorClass: 'text-pink-600 dark:text-pink-400',
    bgLight: 'bg-pink-50',
    bgDark: 'dark:bg-pink-950/40',
  },
  'fashion-pria': {
    emoji: '👔',
    colorClass: 'text-sky-600 dark:text-sky-400',
    bgLight: 'bg-sky-50',
    bgDark: 'dark:bg-sky-950/40',
  },
  'fashion-wanita': {
    emoji: '👗',
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-950/40',
  },
  kecantikan: {
    emoji: '✨',
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgLight: 'bg-purple-50',
    bgDark: 'dark:bg-purple-950/40',
  },
  kesehatan: {
    emoji: '💊',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/40',
  },
  'kesehatan-obat': {
    emoji: '🩹',
    colorClass: 'text-teal-600 dark:text-teal-400',
    bgLight: 'bg-teal-50',
    bgDark: 'dark:bg-teal-950/40',
  },
  'rumah-tangga': {
    emoji: '🏠',
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/40',
  },
  'rumah-tangga-dapur': {
    emoji: '🍳',
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgLight: 'bg-orange-50',
    bgDark: 'dark:bg-orange-950/40',
  },
  'makanan-minuman': {
    emoji: '🍔',
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgLight: 'bg-orange-50',
    bgDark: 'dark:bg-orange-950/40',
  },
  olahraga: {
    emoji: '⚽',
    colorClass: 'text-lime-600 dark:text-lime-400',
    bgLight: 'bg-lime-50',
    bgDark: 'dark:bg-lime-950/40',
  },
  'buku-alat-tulis': {
    emoji: '📚',
    colorClass: 'text-violet-600 dark:text-violet-400',
    bgLight: 'bg-violet-50',
    bgDark: 'dark:bg-violet-950/40',
  },
  'mainan-hobi': {
    emoji: '🎮',
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgLight: 'bg-cyan-50',
    bgDark: 'dark:bg-cyan-950/40',
  },
  'bayi-anak': {
    emoji: '🍼',
    colorClass: 'text-yellow-600 dark:text-yellow-400',
    bgLight: 'bg-yellow-50',
    bgDark: 'dark:bg-yellow-950/40',
  },
  'perlengkapan-hewan': {
    emoji: '🐾',
    colorClass: 'text-amber-700 dark:text-amber-300',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/40',
  },
}

export function getCategoryVisual(slug: string): CategoryVisual {
  return (
    CATEGORY_VISUALS[slug] ?? {
      emoji: '🏷️',
      colorClass: 'text-brand-600 dark:text-brand-400',
      bgLight: 'bg-brand-50',
      bgDark: 'dark:bg-brand-950/40',
    }
  )
}
