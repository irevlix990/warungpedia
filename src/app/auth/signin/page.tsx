import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollReveal } from '@/components/ui'
import { getDictionary } from '@/lib/i18n'
import { SignInForm } from '@/components/features/auth/sign-in-form'
import { signInWithGoogleAction } from '@/app/actions/auth'

export default async function SignInPage() {
  const t = getDictionary()

  return (
    <ScrollReveal delay={0}>
      <Card>
      <CardHeader className="text-center">
        <CardTitle>{t.auth.signInTitle}</CardTitle>
        <CardDescription>{t.auth.signInSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={signInWithGoogleAction}>
          <button
            type="submit"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-800"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-4">
              <path
                fill="#4285F4"
                d="M23.5 12.27c0-.79-.07-1.55-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.55-5.17 3.55-8.87z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.58.38-2.29V6.62H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l3.72-2.52z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.27 6.62l3.72 2.87C6.22 6.86 8.87 4.75 12 4.75z"
              />
            </svg>
            {t.auth.continueWithGoogle}
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
          {t.auth.or}
          <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
        </div>

        <SignInForm t={t.auth} />

        <p className="text-center text-sm text-neutral-500">
          {t.auth.noAccount}{' '}
          <Link href="/auth/signup" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
            {t.auth.signUp}
          </Link>
        </p>
      </CardContent>
    </Card>
    </ScrollReveal>
  )
}
