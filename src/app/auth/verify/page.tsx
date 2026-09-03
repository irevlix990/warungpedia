import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDictionary } from '@/lib/i18n'
import { ResendVerificationForm } from '@/components/features/auth/resend-verification-form'

export default async function VerifyPage() {
  const t = getDictionary()

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t.auth.verifyTitle}</CardTitle>
        <CardDescription>{t.auth.verifySubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ResendVerificationForm t={t.auth} />
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
