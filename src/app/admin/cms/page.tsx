import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n'
import {
  getPublicSiteSettings,
  getSiteSettings,
} from '@/services/admin-service'
import { settingUpsertAction } from '@/app/actions/admin'
import { Card, Button, EmptyState } from '@/components/ui'
import SiteSettingsForm from '@/components/features/admin/site-settings-form'

export const metadata: Metadata = {
  title: 'CMS | Admin ',
}

export default async function AdminCmsPage() {
  const t = getDictionary().admin
  const [site, settings] = await Promise.all([
    getPublicSiteSettings(),
    getSiteSettings(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {t.cms}
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          {t.cmsSubtitle}
        </p>
      </div>

      <Card className="p-5">
        <h3 className="mb-4 font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
          {t.siteSettings}
        </h3>
        <SiteSettingsForm
          defaults={site}
          labels={{
            siteName: t.siteName,
            tagline: t.tagline,
            supportEmail: t.supportEmail,
            about: t.about,
            submit: t.submit,
          }}
        />
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
          {t.addSetting}
        </h3>
        <form
          action={settingUpsertAction}
          className="grid gap-4 sm:grid-cols-3"
        >
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
            {t.key}
            <input
              name="key"
              required
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
            {t.value}
            <input
              name="value"
              required
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </label>
          <div className="flex items-end">
            <Button type="submit" variant="primary" size="sm">
              {t.addSetting}
            </Button>
          </div>
        </form>
      </Card>

      {settings.length === 0 ? (
        <EmptyState title={t.noSettings} />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {settings.map((s) => (
              <div
                key={s.key}
                className="flex items-start justify-between gap-4 p-4"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {s.key}
                  </p>
                  <p className="mt-1 break-all text-sm text-neutral-600 dark:text-neutral-300">
                    {s.value ?? 'â€”'}
                  </p>
                </div>
                {s.description && (
                  <p className="shrink-0 text-xs text-neutral-400">
                    {s.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
