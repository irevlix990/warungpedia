import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDictionary } from '@/lib/i18n'
import { SignUpForm } from '@/components/features/auth/sign-up-form'

export default async function SignUpPage() {
  const t = getDictionary()

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t.auth.signUpTitle}</CardTitle>
        <CardDescription>{t.auth.signUpSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SignUpForm t={t.auth} />

        <p className="text-center text-sm text-neutral-500">
          {t.auth.haveAccount}{' '}
          <Link
            href="/auth/signin"
            className="font-semibold text-brand-600 hover:underline dark:text-brand-300"
          >
            {t.auth.signIn}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
