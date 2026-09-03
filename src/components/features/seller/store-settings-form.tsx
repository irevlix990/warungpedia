'use client'

import { useActionState } from 'react'
import { updateStoreAction } from '@/app/actions/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Store } from '@/types/store'
import type { DictionarySeller } from '../auth/action-strings'

interface StoreSettingsFormProps {
  store: Store
  t: DictionarySeller
}

export function StoreSettingsForm({ store, t }: StoreSettingsFormProps) {
  const [state, action, pending] = useActionState(updateStoreAction, undefined)

  return (
    <form action={action} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <input type="hidden" name="slug" value={store.slug} />

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label
          htmlFor="name"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.storeName}
        </label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={store.name}
          error={Boolean(state?.errors?.name)}
        />
        {state?.errors?.name && (
          <p className="text-xs text-danger-600">
            {state.errors.name[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tagline"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.tagline}
        </label>
        <Input
          id="tagline"
          name="tagline"
          defaultValue={store.tagline ?? ''}
          error={Boolean(state?.errors?.tagline)}
        />
        {state?.errors?.tagline && (
          <p className="text-xs text-danger-600">
            {state.errors.tagline[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="contactEmail"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.contactEmail}
        </label>
        <Input
          id="contactEmail"
          name="contactEmail"
          type="email"
          required
          defaultValue={store.contactEmail}
          error={Boolean(state?.errors?.contactEmail)}
        />
        {state?.errors?.contactEmail && (
          <p className="text-xs text-danger-600">
            {state.errors.contactEmail[0]}
          </p>
        )}
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
          defaultValue={store.description ?? ''}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-soft placeholder:text-neutral-400 focus:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          aria-invalid={Boolean(state?.errors?.description) || undefined}
        />
        {state?.errors?.description && (
          <p className="text-xs text-danger-600">
            {state.errors.description[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="phone"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.phone}
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={store.phone ?? ''}
          error={Boolean(state?.errors?.phone)}
        />
        {state?.errors?.phone && (
          <p className="text-xs text-danger-600">
            {state.errors.phone[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="province"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.province}
        </label>
        <Input
          id="province"
          name="province"
          required
          defaultValue={store.province ?? ''}
          error={Boolean(state?.errors?.province)}
        />
        {state?.errors?.province && (
          <p className="text-xs text-danger-600">
            {state.errors.province[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="city"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {t.city}
        </label>
        <Input
          id="city"
          name="city"
          required
          defaultValue={store.city ?? ''}
          error={Boolean(state?.errors?.city)}
        />
        {state?.errors?.city && (
          <p className="text-xs text-danger-600">{state.errors.city[0]}</p>
        )}
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
        {t.save}
      </Button>
    </form>
  )
}