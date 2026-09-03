import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private/account surfaces and interactive flows are not useful to index.
      disallow: [
        '/account/',
        '/admin/',
        '/seller/',
        '/cart',
        '/checkout',
        '/chat',
        '/orders',
        '/wishlist',
        '/following',
        '/notifications',
        '/auth/',
        '/search',
      ],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  }
}
