import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, EmptyState } from '@/components/ui'
import { ProductCard } from '@/components/features/shop/product-card'
import { SearchControls } from '@/components/features/search/search-controls'
import { SearchPagination } from '@/components/features/search/search-pagination'
import { getDictionary } from '@/lib/i18n'
import { getCategories } from '@/services/catalog-service'
import { searchActiveStores } from '@/services/store-service'
import { searchProducts } from '@/services/product-service'
import { parsePage, parseProductSort } from '@/utils/search'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string | string[]
    cat?: string
    sort?: string
    page?: string
  }>
}

export const metadata: Metadata = {
  title: 'Pencarian',
  description: 'Cari produk dan toko di Warungpedia.',
}

export default async function SearchPage(props: SearchPageProps) {
  const sp = await props.searchParams
  const term = (Array.isArray(sp.q) ? sp.q[0] : sp.q ?? '').trim()
  const categoryId = typeof sp.cat === 'string' ? sp.cat : null
  const sort = parseProductSort(typeof sp.sort === 'string' ? sp.sort : '')
  const page = parsePage(typeof sp.page === 'string' ? sp.page : '')
  const t = getDictionary()

  const categories = await getCategories().catch(() => [])

  const hasTerm = term !== ''

  const [storesResult, productsResult] = await Promise.all([
    hasTerm ? searchActiveStores(term).catch(() => []) : Promise.resolve([]),
    hasTerm
      ? searchProducts({ term, categoryId, sort, page }).catch(() => null)
      : Promise.resolve(null),
  ])

  const products = productsResult?.products ?? []
  const total = productsResult?.total ?? 0
  const totalPages = productsResult?.totalPages ?? 1

  const searchLinkParams = new URLSearchParams(
    {
      ...(term ? { q: term } : {}),
      ...(categoryId ? { cat: categoryId } : {}),
      ...(sort !== 'relevancy' ? { sort } : {}),
    } as Record<string, string>
  ).toString()

  return (
    <main className="container-wp py-10">
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
          {t.shop.searchTitle}
        </h1>
        {term ? (
          <p className="text-neutral-500 dark:text-neutral-400">
            {t.shop.searchResultsFor}{' '}
            <span className="font-semibold text-neutral-800 dark:text-neutral-100">
              &ldquo;{term}&rdquo;
            </span>
          </p>
        ) : null}
      </div>

      {!hasTerm ? (
        <Card className="mt-8 p-6">
          <EmptyState title={t.shop.searchTitle} />
        </Card>
      ) : (
        <div className="mt-8">
          <SearchControls
            term={term}
            categoryId={categoryId}
            sort={sort}
            categories={categories}
            t={t.search}
          />

          {storesResult.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-50">
                {t.search.storeResults}
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {storesResult.map((store) => (
                  <Link
                    key={store.id}
                    href={`/store/${store.slug}`}
                    className="rounded-xl border border-neutral-200 p-4 transition-colors hover:border-brand-400 dark:border-neutral-800 dark:hover:border-brand-600"
                  >
                    <p className="font-semibold text-neutral-900 dark:text-neutral-50">
                      {store.name}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-neutral-500 dark:text-neutral-400">
                      {store.tagline ?? `/store/${store.slug}`}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-50">
                {t.search.productResults}
              </h2>
              {total > 0 && (
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t.search.itemCount.replace('{count}', String(total))}
                </span>
              )}
            </div>

            {products.length === 0 ? (
              <Card className="p-6">
                <EmptyState
                  title={`${t.shop.noResults} “${term}”`}
                  description={t.search.noProductsMatch}
                />
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      storeSlug={product.storeSlug}
                      storeName={product.storeName}
                      t={t.product}
                    />
                  ))}
                </div>
                <SearchPagination
                  baseUrl={`/search?${searchLinkParams}`}
                  page={page}
                  totalPages={totalPages}
                  t={t.search}
                />
              </>
            )}
          </section>
        </div>
      )}
    </main>
  )
}