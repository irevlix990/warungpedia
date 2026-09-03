'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  saveSiteSettingsAction,
  type AdminActionState,
} from '@/app/actions/admin'
import { Button, Input, Badge } from '@/components/ui'

interface SiteDefaults {
  siteName: string
  tagline: string
  supportEmail: string
  about: string
}

export default function SiteSettingsForm({
  defaults,
  labels,
}: {
  defaults: SiteDefaults
  labels: {
    siteName: string
    tagline: string
    supportEmail: string
    about: string
    submit: string
  }
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<
    AdminActionState | undefined,
    FormData
  >(saveSiteSettingsAction, undefined)

  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state, router])

  return (
    <form action={formAction} className="grid gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {labels.siteName}
        <Input
          name="siteName"
          defaultValue={defaults.siteName}
          error={Boolean(state?.errors?.siteName)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {labels.tagline}
        <Input name="tagline" defaultValue={defaults.tagline} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {labels.supportEmail}
        <Input
          name="supportEmail"
          type="email"
          defaultValue={defaults.supportEmail}
          error={Boolean(state?.errors?.supportEmail)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {labels.about}
        <textarea
          name="about"
          rows={4}
          defaultValue={defaults.about}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {labels.submit}
        </Button>
        {state?.message && <Badge variant="danger">{state.message}</Badge>}
      </div>
    </form>
  )
}
