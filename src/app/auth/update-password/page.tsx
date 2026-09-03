import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDictionary } from '@/lib/i18n'
import { UpdatePasswordForm } from '@/components/features/auth/update-password-form'

export default async function UpdatePasswordPage() {
  const t = getDictionary()

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t.auth.resetPasswordTitle}</CardTitle>
        <CardDescription>{t.auth.pleaseConfirm}</CardDescription>
      </CardHeader>
      <CardContent>
        <UpdatePasswordForm t={t.auth} />
      </CardContent>
    </Card>
  )
}
