'use client'

import { useActionState } from 'react'
import { updateProfileAction } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ImageUpload } from '@/components/ui/image-upload'
import { User, Palette, Bell } from 'lucide-react'
import type { DictionaryAccount } from '../auth/action-strings'

interface ProfileFormProps {
  t: DictionaryAccount
  userId: string
  defaultValues: {
    fullName: string
    email: string
    avatarUrl: string | null
    phone: string | null
    preferredLocale: 'id' | 'en'
    themePreference: 'light' | 'dark' | 'system'
    notificationPrefs: Record<string, boolean>
  }
}

export function ProfileForm({ t, userId, defaultValues }: ProfileFormProps) {
  const [state, action, pending] = useActionState(
    updateProfileAction,
    undefined
  )

  return (
    <form action={action} className="flex flex-col gap-8">
      {/* ═══════════════════════════════════════════════
          Section 1 — Profile Photo
          ═══════════════════════════════════════════════ */}
      <section className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <ImageUpload
          name="avatarUrl"
          bucket="avatars"
          prefix={userId}
          value={defaultValues.avatarUrl ?? ''}
          label={t.avatar}
          aspect="square"
          className="h-28 w-28 shrink-0"
        />
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {defaultValues.fullName || t.avatar}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t.avatarHint}
          </p>
        </div>
      </section>

      <hr className="border-neutral-200 dark:border-neutral-700" />

      {/* ═══════════════════════════════════════════════
          Section 2 — Personal Information
          ═══════════════════════════════════════════════ */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t.personalInfo}
          </h3>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 -mt-2">
          {t.personalInfoSubtitle}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {t.fullName}
            </label>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              defaultValue={defaultValues.fullName}
              error={Boolean(state?.errors?.fullName)}
            />
            {state?.errors?.fullName && (
              <p className="text-xs text-danger-600">{state.errors.fullName[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {t.phone}
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="08xxxxxxxxxx"
              defaultValue={defaultValues.phone ?? ''}
              error={Boolean(state?.errors?.phone)}
            />
            {state?.errors?.phone && (
              <p className="text-xs text-danger-600">{state.errors.phone[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {t.email}
            </label>
            <Input
              id="email"
              value={defaultValues.email}
              disabled
              className="disabled:opacity-60"
            />
          </div>
        </div>
      </section>

      <hr className="border-neutral-200 dark:border-neutral-700" />

      {/* ═══════════════════════════════════════════════
          Section 3 — Preferences
          ═══════════════════════════════════════════════ */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t.preferences}
          </h3>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 -mt-2">
          {t.preferencesSubtitle}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="themePreference" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {t.theme}
            </label>
            <Select
              id="themePreference"
              name="themePreference"
              defaultValue={defaultValues.themePreference}
            >
              <option value="light">{t.themeLight}</option>
              <option value="dark">{t.themeDark}</option>
              <option value="system">{t.themeSystem}</option>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="preferredLocale" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {t.language}
            </label>
            <Select
              id="preferredLocale"
              name="preferredLocale"
              defaultValue={defaultValues.preferredLocale}
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </Select>
          </div>
        </div>
      </section>

      <hr className="border-neutral-200 dark:border-neutral-700" />

      {/* ═══════════════════════════════════════════════
          Section 4 — Notification Settings
          ═══════════════════════════════════════════════ */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t.notificationSettings}
          </h3>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 -mt-2">
          {t.notificationSettingsSubtitle}
        </p>

        <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
          <NotificationToggle
            name="notifOrderUpdates"
            label={t.notifOrderUpdates}
            description={t.notifOrderUpdatesDesc}
            defaultChecked={defaultValues.notificationPrefs.orderUpdates ?? true}
          />
          <NotificationToggle
            name="notifPromotions"
            label={t.notifPromotions}
            description={t.notifPromotionsDesc}
            defaultChecked={defaultValues.notificationPrefs.promotions ?? false}
          />
          <NotificationToggle
            name="notifChat"
            label={t.notifChat}
            description={t.notifChatDesc}
            defaultChecked={defaultValues.notificationPrefs.chat ?? true}
          />
        </div>
      </section>

      {state?.message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            state.success
              ? 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-200'
              : 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-200'
          }`}
        >
          {state.success ? t.saved : state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {t.edit}
      </Button>
    </form>
  )
}

function NotificationToggle({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string
  label: string
  description: string
  defaultChecked: boolean
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{description}</span>
      </div>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 shrink-0 rounded border-neutral-300 text-brand-600 focus:ring-brand-500/30"
      />
    </label>
  )
}
