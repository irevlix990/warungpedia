import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'

/** Builds an absolute URL from a site-relative path. */
export function absoluteUrl(path = '/'): string {
  const base = siteConfig.url.replace(/\/+$/, '')
  if (!path) return `${base}/`
  const p = path.startsWith('/') ? path : `/${path}`
  return p === '/' ? `${base}/` : `${base}${p}`
}

/**
 * Escapes a single string so it can be embedded inside `<script>` without
 * closing the tag or introducing markup. Server-side JSON-LD is rendered via
 * `dangerouslySetInnerHTML`, and its fields (product/store name, description,
 * brand) are seller-controlled, so `<`/`>`/`&` and the `</script` sequence
 * must never appear verbatim or the JSON breaks out into executable HTML.
 */
export function escapeJsonLdText(value: string): string {
  return value
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/** Deep-escapes every string leaf of a JSON-LD object for safe embedding. */
export function escapeJsonLd(data: unknown): unknown {
  if (typeof data === 'string') return escapeJsonLdText(data)
  if (Array.isArray(data)) return data.map(escapeJsonLd)
  if (data && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([key, value]) => [
        key,
        escapeJsonLd(value),
      ])
    )
  }
  return data
}

/** Applies the site-name suffix used by the root layout title template. */
export function makeTitle(title: string): string {
  return `${title} · ${siteConfig.name}`
}

export interface SeoOptions {
  /** Whole-page title WITHOUT the site-name suffix (template adds it). */
  title: string
  /** Meta description. Defaults to the site description. */
  description?: string
  /** Site-relative canonical path (e.g. `/store/acme`). */
  path?: string
  /** Absolute or site-relative Open Graph image. */
  ogImage?: string
  type?: 'website' | 'article' | 'profile'
  /** When true, adds robots noindex,nofollow and omits a canonical. */
  noindex?: boolean
}

/**
 * Builds a consistent `Metadata` object: canonical/alternates, Open Graph,
 * Twitter card and a robots directive, all derived from a single title +
 * description so every page reads the same way.
 */
export function buildMetadata(opts: SeoOptions): Metadata {
  const description = opts.description ?? siteConfig.description
  const fullTitle = makeTitle(opts.title)
  const canonical = opts.noindex ? undefined : absoluteUrl(opts.path ?? '/')
  const ogImage = opts.ogImage ? absoluteUrl(opts.ogImage) : undefined

  return {
    title: opts.title,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: 'id_ID',
      type: opts.type ?? 'website',
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                width: 1200,
                height: 630,
                alt: fullTitle,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: opts.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}

/** JSON-LD for an Organization / WebSite (homepage). */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    description: siteConfig.description,
    url: absoluteUrl('/'),
  }
}

export interface BreadcrumbItem {
  label: string
  path: string
}

/** JSON-LD for a BreadcrumbList, e.g. store and product trails. */
export function breadcrumbJsonLd(
  items: BreadcrumbItem[]
): Record<string, unknown> {
  const list = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    item: absoluteUrl(item.path),
  }))
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list,
  }
}

export interface ProductJsonLdInput {
  name: string
  description?: string | null
  imageUrl?: string | null
  price: number
  currency?: string
  availability: 'InStock' | 'OutOfStock' | 'PreOrder'
  url: string
  brand?: string | null
  sku?: string
  ratingAvg?: number
  reviewsCount?: number
}

/** JSON-LD for a single Product (product detail page). */
export function productJsonLd(
  input: ProductJsonLdInput
): Record<string, unknown> {
  const result: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    ...(input.imageUrl ? { image: [absoluteUrl(input.imageUrl)] } : {}),
    ...(input.brand ? { brand: { '@type': 'Brand', name: input.brand } } : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: input.currency ?? siteConfig.currency,
      price: input.price,
      availability: `https://schema.org/${input.availability}`,
      url: absoluteUrl(input.url),
    },
    ...(input.sku ? { sku: input.sku } : {}),
  }
  if (input.ratingAvg !== undefined && input.reviewsCount !== undefined) {
    result.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(input.ratingAvg.toFixed(1)),
      reviewCount: input.reviewsCount,
    }
  }
  return result
}
