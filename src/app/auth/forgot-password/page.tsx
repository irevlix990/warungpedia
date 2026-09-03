import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDictionary } from '@/lib/i18n'
import { ForgotPasswordForm } from '@/components/features/auth/forgot-password-form'

export default async function ForgotPasswordPage() {
  const t = getDictionary()

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t.auth.resetPasswordTitle}</CardTitle>
        <CardDescription>{t.auth.resetPasswordSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ForgotPasswordForm t={t.auth} />
        <p className="text-center text-sm text-neutral-500">
          <Link
            href="/auth/signin"
            className="font-semibold text-brand-600 hover:underline dark:text-brand-300"
          >
            {t.auth.backToSignIn}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
