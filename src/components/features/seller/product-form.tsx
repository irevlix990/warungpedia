'use client'

import { useActionState } from 'react'
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from '@/app/actions/product'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Product } from '@/types/product'
import type { Category } from '@/types/catalog'
import type { DictionaryProduct } from '../auth/action-strings'

interface ProductFormProps {
  t: DictionaryProduct
  categories: Category[]
  product?: Product
}

export function ProductForm({
  t,
  categories,
  product,
}: ProductFormProps) {
  const action = product ? updateProductAction : createProductAction
  const [state, formAction, pending] = useActionState<
    ProductFormState | undefined,
    FormData
  >(action, undefined)

  const error = (field: string) => {
    const list = state?.errors?.[field]
    return list && list.length > 0 ? list[0] : undefined
  }

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-5 sm:grid-cols-2"
    >
      {product && (
        <input type="hidden" name="productId" value={product.id} />
      )}

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label
          htmlFor="name"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.name}
        </label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={product?.name}
          error={Boolean(error('name'))}
        />
        {error('name') && (
          <p className="text-xs text-danger-600">{error('name')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="slug"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.slug}
        </label>
        <Input
          id="slug"
          name="slug"
          defaultValue={product?.slug}
          placeholder={product ? product.slug : ''}
        />
        {error('slug') && (
          <p className="text-xs text-danger-600">{error('slug')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="brand"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.brand}
        </label>
        <Input
          id="brand"
          name="brand"
          defaultValue={product?.brand ?? ''}
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label
          htmlFor="description"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.description}
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description ?? ''}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-soft placeholder:text-neutral-400 focus:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="price"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.price}
        </label>
        <Input
          id="price"
          name="price"
          type="number"
          inputMode="numeric"
          required
          min={0}
          defaultValue={product?.price}
          error={Boolean(error('price'))}
        />
        {error('price') && (
          <p className="text-xs text-danger-600">{error('price')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="compareAtPrice"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.compareAtPrice}
        </label>
        <Input
          id="compareAtPrice"
          name="compareAtPrice"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={product?.compareAtPrice ?? ''}
          error={Boolean(error('compareAtPrice'))}
        />
        {error('compareAtPrice') && (
          <p className="text-xs text-danger-600">{error('compareAtPrice')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="stock"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.stock}
        </label>
        <Input
          id="stock"
          name="stock"
          type="number"
          inputMode="numeric"
          required
          min={0}
          defaultValue={product?.stock ?? 0}
          error={Boolean(error('stock'))}
        />
        {error('stock') && (
          <p className="text-xs text-danger-600">{error('stock')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="lowStockThreshold"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.lowStock}
        </label>
        <Input
          id="lowStockThreshold"
          name="lowStockThreshold"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={product?.lowStockThreshold ?? 5}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="weight"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.weight}
        </label>
        <Input
          id="weight"
          name="weight"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={product?.weightGrams ?? ''}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="condition"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.condition}
        </label>
        <select
          id="condition"
          name="condition"
          defaultValue={product?.condition ?? 'new'}
          className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 shadow-soft focus:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          <option value="new">{t.conditionNew}</option>
          <option value="used">{t.conditionUsed}</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="categoryId"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          Kategori
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={product?.categoryId ?? ''}
          className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 shadow-soft focus:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          <option value="">—</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label
          htmlFor="imageUrls"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.images}
        </label>
        <Input
          id="imageUrls"
          name="imageUrls"
          defaultValue={product?.imageUrls.join(', ')}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700 sm:col-span-2 dark:text-neutral-200">
        <input
          type="checkbox"
          name="isFeatured"
          defaultChecked={product?.isFeatured ?? false}
          className="size-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
        />
        {t.featured}
      </label>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label
          htmlFor="status"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.status}
        </label>
        <select
          id="status"
          name="status"
          defaultValue={product?.status ?? 'DRAFT'}
          className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 shadow-soft focus:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          <option value="DRAFT">{t.statusDraft}</option>
          <option value="ACTIVE">{t.statusActive}</option>
          <option value="ARCHIVED">{t.statusArchived}</option>
        </select>
      </div>

      {state?.message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm sm:col-span-2 ${
            state.success
              ? 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-200'
              : 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-200'
          }`}
        >
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-fit sm:col-span-2">
        {product ? t.update : t.create}
      </Button>
    </form>
  )
}
