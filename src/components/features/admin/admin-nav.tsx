'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface AdminNavLink {
  href: string
  label: string
  match?: (pathname: string) => boolean
}

export interface AdminNavGroup {
  title: string
  links: AdminNavLink[]
}

interface AdminNavProps {
  groups: AdminNavGroup[]
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AdminNav({ groups }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <nav className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1">
      {groups.map((group, gi) => (
        <div
          key={group.title}
          className="flex flex-wrap items-center gap-x-1 gap-y-1"
        >
          {gi > 0 && (
            <span className="mx-2 hidden h-5 w-px bg-neutral-200 sm:block dark:bg-neutral-800" />
          )}
          <span className="mr-1 hidden text-[11px] font-semibold uppercase tracking-wide text-neutral-400 lg:block dark:text-neutral-500">
            {group.title}
          </span>
          {group.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                isActive(pathname, link.href)
                  ? 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200'
                  : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  )
}
