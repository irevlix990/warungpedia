import { describe, expect, it } from 'vitest'
import { siteConfig } from '@/config/site'
import {
  absoluteUrl,
  breadcrumbJsonLd,
  buildMetadata,
  makeTitle,
  organizationJsonLd,
  productJsonLd,
} from '@/lib/seo/seo'

const base = siteConfig.url.replace(/\/+$/, '')

describe('absoluteUrl', () => {
  it('joins the site origin with a path', () => {
    expect(absoluteUrl('/store/acme')).toBe(`${base}/store/acme`)
  })

  it('normalizes a path without a leading slash', () => {
    expect(absoluteUrl('store/acme')).toBe(`${base}/store/acme`)
  })

  it('defaults to the root', () => {
    expect(absoluteUrl()).toBe(`${base}/`)
  })
})

describe('makeTitle', () => {
  it('appends the site name', () => {
    expect(makeTitle('Belanja')).toBe(`Belanja · ${siteConfig.name}`)
  })
})

describe('buildMetadata', () => {
  it('sets canonical, og, twitter and robots from a path', () => {
    const md = buildMetadata({ title: 'Pencarian', path: '/search' })
    expect(md.title).toBe('Pencarian')
    expect(md.alternates?.canonical).toBe(`${base}/search`)
    expect(md.openGraph?.url).toBe(`${base}/search`)
    expect((md.openGraph as Record<string, unknown>).type).toBe('website')
    expect((md.twitter as Record<string, unknown>).card).toBe(
      'summary_large_image'
    )
    expect(md.robots).toEqual({ index: true, follow: true })
  })

  it('sets noindex and drops the canonical when requested', () => {
    const md = buildMetadata({ title: 'Secret', path: '/a', noindex: true })
    expect(md.robots).toEqual({ index: false, follow: false })
    expect(md.alternates).toBeUndefined()
    expect(md.openGraph?.url).toBeUndefined()
  })

  it('resolves an absolute og image and adds a full card', () => {
    const md = buildMetadata({ title: 'X', path: '/x', ogImage: '/img.png' })
    expect((md.openGraph?.images as Array<Record<string, unknown>>)[0].url).toBe(
      `${base}/img.png`
    )
    expect(md.twitter?.images).toEqual([`${base}/img.png`])
  })
})

describe('organizationJsonLd', () => {
  it('emits a schema.org Organization', () => {
    const data = organizationJsonLd()
    expect(data['@type']).toBe('Organization')
    expect(data.name).toBe(siteConfig.name)
    expect(data.url).toBe(`${base}/`)
  })
})

describe('breadcrumbJsonLd', () => {
  it('builds a position-indexed list with absolute items', () => {
    const data = breadcrumbJsonLd([
      { label: 'Beranda', path: '/' },
      { label: 'Toko', path: '/store/acme' },
    ])
    expect(data['@type']).toBe('BreadcrumbList')
    const list = data.itemListElement as Array<Record<string, unknown>>
    expect(list).toHaveLength(2)
    expect(list[0].position).toBe(1)
    expect(list[0].item).toBe(`${base}/`)
    expect(list[1].position).toBe(2)
    expect(list[1].item).toBe(`${base}/store/acme`)
  })
})

describe('productJsonLd', () => {
  const baseInput = {
    name: 'Kaos',
    price: 50000,
    url: '/store/acme/product/kaos',
  }

  it('emits an Offer with IDR price and availability', () => {
    const data = productJsonLd({ ...baseInput, availability: 'InStock' })
    const offer = data.offers as Record<string, unknown>
    expect(data['@type']).toBe('Product')
    expect(offer.priceCurrency).toBe('IDR')
    expect(offer.price).toBe(50000)
    expect(offer.availability).toBe('https://schema.org/InStock')
    expect(offer.url).toBe(`${base}/store/acme/product/kaos`)
  })

  it('adds aggregateRating only when both rating and count are present', () => {
    const without = productJsonLd({ ...baseInput, availability: 'InStock' })
    expect(without.aggregateRating).toBeUndefined()

    const withRating = productJsonLd({
      ...baseInput,
      availability: 'OutOfStock',
      ratingAvg: 4.5,
      reviewsCount: 2,
    })
    expect(withRating.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.5,
      reviewCount: 2,
    })
  })

  it('resolves the image to an absolute URL and adds brand', () => {
    const data = productJsonLd({
      ...baseInput,
      imageUrl: '/img.png',
      brand: 'Nike',
      availability: 'InStock',
    })
    expect((data.image as string[])[0]).toBe(`${base}/img.png`)
    expect((data.brand as Record<string, unknown>).name).toBe('Nike')
  })
})
