import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/dal'
import { getAdminSupportConversations } from '@/services/communication-service'
import { AdminSupportChatDashboard } from '@/components/features/admin/admin-support-chat'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Live Chat Support | Admin Warungpedia',
  description: 'Kelola dan balas pertanyaan live chat dari pengguna secara realtime.',
}

export default async function AdminSupportChatPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') redirect('/')

  const conversations = await getAdminSupportConversations()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Live Chat Support
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Balas pesan dan layani pengguna marketplace secara langsung secara real-time.
        </p>
      </div>

      <AdminSupportChatDashboard
        initialConversations={conversations}
        adminUserId={user.id}
      />
    </div>
  )
}
