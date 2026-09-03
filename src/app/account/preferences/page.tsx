import { requireUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import {
  getNotificationPrefs,
  getNotificationTypes,
} from '@/services/communication-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationPrefsForm } from '@/components/features/communication/notification-prefs-form'

export default async function NotificationPrefsPage() {
  const t = getDictionary()
  await requireUser()
  const [prefs, types] = await Promise.all([
    getNotificationPrefs(),
    getNotificationTypes(),
  ])

  return (
    <div className="mt-6 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.communication.preferences}</CardTitle>
          <CardDescription>{t.communication.preferencesSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPrefsForm
            t={t.communication}
            defaultValues={prefs}
            types={types.map((r) => r.code)}
          />
        </CardContent>
      </Card>
    </div>
  )
}