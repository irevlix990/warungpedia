import { requireUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProfileForm } from '@/components/features/account/profile-form'

export default async function ProfilePage() {
  const t = getDictionary()
  const user = await requireUser()

  return (
    <div className="mt-6 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.account.profileTitle}</CardTitle>
          <CardDescription>{t.account.profileSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            t={t.account}
            defaultValues={{
              fullName: user.fullName,
              email: user.email ?? '',
              avatarUrl: user.avatarUrl,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.account.role}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="brand">{user.role}</Badge>
        </CardContent>
      </Card>
    </div>
  )
}
