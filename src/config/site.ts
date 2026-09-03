/**
 * Global site configuration.
 */

export const siteConfig = {
  name: 'Warungpedia',
  description:
    'Warungpedia adalah marketplace multi-penjual untuk Indonesia.',
  currency: 'IDR',
  defaultLocale: 'id',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
} as const
