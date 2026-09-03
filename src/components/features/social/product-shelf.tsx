import Link from 'next/link'
import { ProductCard } from '../shop/product-card'
import type { Product } from '@/types/product'
import type { DictionaryProduct } from '../auth/action-strings'

interface ProductShelfProps {
  title: string
  products: (Product & { storeSlug: string })[]
  storeNameBySlug?: Record<string, string>
  t: DictionaryProduct
}

/** A horizontal grid of product cards with a section title. */
export function ProductShelf({
  title,
  products,
  storeNameBySlug,
  t,
}: ProductShelfProps) {
  if (products.length === 0) return null
  return (
    <section className="mt-12">
      <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
        {title}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            storeSlug={p.storeSlug}
            storeName={storeNameBySlug?.[p.storeSlug]}
            t={t}
          />
        ))}
      </div>
    </section>
  )
}

/** Convenience empty-state link back to the catalogue. */
export function BrowseLink({
  href,
  label,
}: {
  href: string
  label: string
}) {
  return (
    <Link href={href} className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300">
      {label} →
    </Link>
  )
}
