import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth/dal'
import { getAdminUsers } from '@/services/admin-service'
import { Card, EmptyState } from '@/components/ui'
import UserRoleForm from '@/components/features/admin/user-role-form'

export const metadata: Metadata = {
  title: 'Pengguna | Admin ',
}

export default async function AdminUsersPage() {
  const t = getDictionary()
  const admin = t.admin
  const [currentUser, users] = await Promise.all([
    getCurrentUser(),
    getAdminUsers(),
  ])
  const canManage = currentUser?.role === 'SUPER_ADMIN'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {admin.users}
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          {admin.usersSubtitle}
        </p>
      </div>
      {!canManage && (
        <Card className="p-4 text-sm text-neutral-600 dark:text-neutral-300">
          {admin.roleChangedNotice}
        </Card>
      )}

      {users.length === 0 ? (
        <EmptyState title={admin.noUsers} />
      ) : (
        <div className="grid gap-4">
          {users.map((u) => (
            <Card key={u.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {u.fullName || 'â€”'}
                  </p>
                  <p className="text-xs text-neutral-500">{u.email ?? 'â€”'}</p>
                  {u.phone && (
                    <p className="text-xs text-neutral-500">{u.phone}</p>
                  )}
                  <p className="mt-1 text-xs text-neutral-400">
                    {new Date(u.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <UserRoleForm
                  userId={u.id}
                  role={u.role}
                  canManage={canManage}
                  t={{ changeRole: admin.changeRole }}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
