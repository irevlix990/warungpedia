'use client'

import { useActionState } from 'react'
import { saveNotificationPrefsAction } from '@/app/actions/communication'
import type { NotificationPrefs } from '@/types/communication'
import { Button } from '@/components/ui/button'
import type { DictionaryCommunication } from '../auth/action-strings'

interface NotificationPrefsFormProps {
  t: DictionaryCommunication
  defaultValues: NotificationPrefs
  types: string[]
}

export function NotificationPrefsForm({
  t,
  defaultValues,
  types,
}: NotificationPrefsFormProps) {
  const [state, formAction, pending] = useActionState(
    saveNotificationPrefsAction,
    undefined
  )

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-3">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-neutral-800 dark:text-neutral-200">
            {t.push}
          </span>
          <input
            type="checkbox"
            name="push"
            defaultChecked={defaultValues.push}
            className="size-4 accent-brand-600"
          />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-neutral-800 dark:text-neutral-200">
            {t.email}
          </span>
          <input
            type="checkbox"
            name="email"
            defaultChecked={defaultValues.email}
            className="size-4 accent-brand-600"
          />
        </label>
      </div>

      <div className="space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
          {t.notifications}
        </p>
        {types.map((code) => (
          <label
            key={code}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="text-neutral-700 dark:text-neutral-300">
              {(t.types as Record<string, string>)[code] ?? code}
            </span>
            <input
              type="checkbox"
              name="type"
              value={code}
              defaultChecked={defaultValues.types[code] !== false}
              className="size-4 accent-brand-600"
            />
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t.save}
        </Button>
        {state?.success && (
          <p className="text-sm text-success-600">{t.saved}</p>
        )}
      </div>
      {state?.message && (
        <p className="text-sm text-danger-600">{state.message}</p>
      )}
    </form>
  )
}