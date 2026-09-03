'use client'

import Link from 'next/link'
import Image from 'next/image'
import { setProductStatusAction, deleteProductAction } from '@/app/actions/product'
import { Badge, Button } from '@/components/ui'
import { stockLevel, productThumbnail } from '@/utils/product'
import type { Product } from '@/types/product'
import type { DictionaryProduct } from '../auth/action-strings'

const statusVariant: Record<
  Product['status'],
  'warning' | 'success' | 'neutral'
> = {
  DRAFT: 'warning',
  ACTIVE: 'success',
  ARCHIVED: 'neutral',
}

const stockVariant: Record<
  ReturnType<typeof stockLevel>,
  'success' | 'warning' | 'danger'
> = {
  in: 'success',
  low: 'warning',
  out: 'danger',
}

const stockKey: Record<
  ReturnType<typeof stockLevel>,
  'stockIn' | 'stockLow' | 'stockOut'
> = {
  in: 'stockIn',
  low: 'stockLow',
  out: 'stockOut',
}

interface ProductTableProps {
  products: Product[]
  t: DictionaryProduct
}

export function ProductTable({ products, t }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
        {t.noProducts}
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {products.map((product) => {
        const thumb = productThumbnail(product.imageUrls)
        const level = stockLevel(product.stock, product.lowStockThreshold)
        return (
          <li
            key={product.id}
            className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <span className="text-xs text-neutral-400">
                    {t.imageFallback}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <Link
                  href={`/seller/products/${product.id}`}
                  className="truncate font-semibold text-neutral-900 hover:underline dark:text-neutral-50"
                >
                  {product.name}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant[product.status]}>
                    {t[`status${product.status.charAt(0)}${product.status.slice(1).toLowerCase()}` as keyof DictionaryProduct]}
                  </Badge>
                  <Badge variant={stockVariant[level]}>
                    {t[stockKey[level]]} · {product.stock}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:shrink-0">
              {product.status === 'DRAFT' && (
                <form action={setProductStatusAction}>
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="status" value="ACTIVE" />
                  <Button type="submit" variant="secondary" size="sm">
                    {t.publish}
                  </Button>
                </form>
              )}
              {product.status === 'ACTIVE' && (
                <form action={setProductStatusAction}>
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="status" value="ARCHIVED" />
                  <Button type="submit" variant="outline" size="sm">
                    {t.archive}
                  </Button>
                </form>
              )}
              {product.status === 'ARCHIVED' && (
                <form action={setProductStatusAction}>
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="status" value="DRAFT" />
                  <Button type="submit" variant="ghost" size="sm">
                    {t.draft}
                  </Button>
                </form>
              )}
              <Link href={`/seller/products/${product.id}`}>
                <Button variant="ghost" size="sm">
                  {t.edit}
                </Button>
              </Link>
              {(product.status === 'DRAFT' || product.status === 'ARCHIVED') && (
                <form
                  action={deleteProductAction}
                  onSubmit={(e) => {
                    if (!window.confirm(t.deleteConfirm)) {
                      e.preventDefault()
                    }
                  }}
                >
                  <input type="hidden" name="productId" value={product.id} />
                  <Button type="submit" variant="danger" size="sm">
                    {t.delete}
                  </Button>
                </form>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
