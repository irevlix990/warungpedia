'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  categoryUpsertAction,
  type AdminActionState,
} from '@/app/actions/admin'
import { Button, Input, Badge } from '@/components/ui'
import type { Category } from '@/types/catalog'

interface CategoryFormLabels {
  newCategory: string
  editCategory: string
  name: string
  slug: string
  description: string
  parent: string
  sortOrder: string
  imageUrl: string
  submit: string
  none: string
}

export default function CategoryForm({
  editCategory,
  parents,
  labels,
}: {
  editCategory?: Category | null
  parents: { id: string; name: string }[]
  labels: CategoryFormLabels
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<
    AdminActionState | undefined,
    FormData
  >(categoryUpsertAction, undefined)

  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state, router])

  const isEdit = Boolean(editCategory)
  const parentOptions = parents.filter(
    (p) => p.id !== editCategory?.id
  )

  return (
    <form action={formAction} className="grid gap-4">
      {isEdit && (
        <input type="hidden" name="id" value={editCategory!.id} />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {labels.name}
          <Input
            name="name"
            defaultValue={editCategory?.name ?? ''}
            error={Boolean(state?.errors?.name)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {labels.slug}
          <Input
            name="slug"
            defaultValue={editCategory?.slug ?? ''}
            error={Boolean(state?.errors?.slug)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {labels.parent}
          <select
            name="parentId"
            defaultValue={editCategory?.parentId ?? ''}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="">{labels.none}</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {labels.sortOrder}
          <Input
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={String(editCategory?.sortOrder ?? 0)}
            error={Boolean(state?.errors?.sortOrder)}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {labels.description}
        <textarea
          name="description"
          rows={2}
          defaultValue={editCategory?.description ?? ''}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {labels.imageUrl}
        <Input
          name="imageUrl"
          defaultValue={editCategory?.imageUrl ?? ''}
          error={Boolean(state?.errors?.imageUrl)}
        />
      </label>
      {state?.errors?.imageUrl && (
        <Badge variant="danger">{state.errors.imageUrl[0]}</Badge>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {isEdit ? labels.editCategory : labels.newCategory}
        </Button>
        {state?.message && <Badge variant="danger">{state.message}</Badge>}
      </div>
    </form>
  )
}
