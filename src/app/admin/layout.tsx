import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import AdminNav, {
  type AdminNavGroup,
} from '@/components/features/admin/admin-nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = getDictionary()
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') redirect('/')

  const groups: AdminNavGroup[] = [
    {
      title: t.admin.groups.overview,
      links: [{ href: '/admin', label: t.admin.dashboard }],
    },
    {
      title: t.admin.groups.marketplace,
      links: [
        { href: '/admin/stores', label: t.admin.storesReview },
        { href: '/admin/products', label: t.admin.products },
        { href: '/admin/categories', label: t.admin.categories },
        { href: '/admin/reviews', label: t.admin.reviews },
      ],
    },
    {
      title: t.admin.groups.commerce,
      links: [
        { href: '/admin/orders', label: t.admin.orders },
        { href: '/admin/disputes', label: t.shipping.adminTitle },
      ],
    },
    {
      title: t.admin.groups.finance,
      links: [
        { href: '/admin/withdrawals', label: t.admin.withdrawals },
        { href: '/admin/vouchers', label: t.admin.vouchers },
        { href: '/admin/flash-sales', label: t.admin.flashSales },
      ],
    },
    {
      title: t.admin.groups.users,
      links: [{ href: '/admin/users', label: t.admin.users }],
    },
    {
      title: t.analytics.title,
      links: [{ href: '/admin/analytics', label: t.admin.analytics }],
    },
    {
      title: t.admin.groups.cms,
      links: [{ href: '/admin/cms', label: t.admin.cms }],
    },
  ]

  return (
    <main className="container-wp py-10">
      <div className="mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <h1 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {t.admin.title}
        </h1>
        <AdminNav groups={groups} />
      </div>
      {children}
    </main>
  )
}