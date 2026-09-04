import Link from 'next/link'
import { getDictionary } from '@/lib/i18n'
import { Logo } from './logo'
import { SearchForm } from './search-form'
import { UserMenu } from './user-menu'
import { NotificationBell } from './notification-bell'

const navLinkClass =
  'relative rounded-xl px-3.5 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-neutral-50'

/** Global site header: brand, navigation, search and account controls. */
export function Header() {
  const t = getDictionary()

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/80 backdrop-blur-lg dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="container-wp py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Logo />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Utama">
            <Link href="/" className={navLinkClass}>
              {t.nav.home}
            </Link>
            <Link href="/categories" className={navLinkClass}>
              {t.nav.categories}
            </Link>
          </nav>

          <div className="order-last w-full md:order-none md:w-auto md:flex-1">
            <SearchForm placeholder={t.shop.searchPlaceholder} />
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  )
}