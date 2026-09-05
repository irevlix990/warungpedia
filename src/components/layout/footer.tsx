import Link from 'next/link'
import { getDictionary } from '@/lib/i18n'
import { Logo } from './logo'
import { ScrollReveal } from '@/components/ui'

/** Global site footer with curated links that all point to live routes. */
export function Footer() {
  const t = getDictionary()

  return (
    <footer className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <ScrollReveal delay={0}>
      <div className="container-wp py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="max-w-sm space-y-3">
            <Logo />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t.footer.tagline}
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">
              {t.footer.browse}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-neutral-600 hover:text-brand-600 dark:text-neutral-300 dark:hover:text-brand-300"
                >
                  {t.footer.categoryHome}
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-neutral-600 hover:text-brand-600 dark:text-neutral-300 dark:hover:text-brand-300"
                >
                  {t.footer.allCategories}
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="text-neutral-600 hover:text-brand-600 dark:text-neutral-300 dark:hover:text-brand-300"
                >
                  {t.common.search}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">
              {t.footer.account}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/auth/signin"
                  className="text-neutral-600 hover:text-brand-600 dark:text-neutral-300 dark:hover:text-brand-300"
                >
                  {t.footer.signIn}
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/signup"
                  className="text-neutral-600 hover:text-brand-600 dark:text-neutral-300 dark:hover:text-brand-300"
                >
                  {t.footer.signUp}
                </Link>
              </li>
              <li>
                <Link
                  href="/account/profile"
                  className="text-neutral-600 hover:text-brand-600 dark:text-neutral-300 dark:hover:text-brand-300"
                >
                  {t.footer.accountProfile}
                </Link>
              </li>
              <li>
                <Link
                  href="/seller/join"
                  className="text-neutral-600 hover:text-brand-600 dark:text-neutral-300 dark:hover:text-brand-300"
                >
                  {t.footer.becomeSeller}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-neutral-200 pt-6 text-xs text-neutral-500 sm:flex-row dark:border-neutral-800 dark:text-neutral-400">
          <p>
            © {new Date().getFullYear()} Warungpedia. {t.footer.rights}
          </p>
          <p className="font-mono">Rupiah (IDR) · Indonesia</p>
        </div>
      </div>
      </ScrollReveal>
    </footer>
  )
}