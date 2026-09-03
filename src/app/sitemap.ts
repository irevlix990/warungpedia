import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo/seo'
import {
  getSitemapCategories,
  getSitemapProducts,
  getSitemapStores,
} from '@/services/seo-service'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, stores, products] = await Promise.all([
    getSitemapCategories().catch(() => []),
    getSitemapStores().catch(() => []),
    getSitemapProducts().catch(() => []),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/categories'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/search'),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: absoluteUrl(`/category/${category.slug}`),
    lastModified: category.updatedAt ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const storeRoutes: MetadataRoute.Sitemap = stores.map((store) => ({
    url: absoluteUrl(`/store/${store.slug}`),
    lastModified: store.updatedAt ?? undefined,
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(
      `/store/${product.storeSlug}/product/${product.productSlug}`
    ),
    lastModified: product.updatedAt ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.9,
  }))

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...storeRoutes,
    ...productRoutes,
  ]
}
