import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Warungpedia — Belanja yang lebih mudah',
    short_name: 'Warungpedia',
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#8C56D4',
    orientation: 'portrait-primary',
    lang: 'id',
    categories: ['shopping', 'business'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon.png',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
