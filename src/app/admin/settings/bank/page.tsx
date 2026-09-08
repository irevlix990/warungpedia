import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/dal'
import { getPaymentBankSettings } from '@/services/payment-settings-service'
import { BankSettingsForm } from '@/components/features/admin/bank-settings-form'
import { Card } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Pengaturan Bank | Admin Warungpedia',
}

export default async function AdminBankSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') redirect('/')

  const settings = await getPaymentBankSettings()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
          Pengaturan Rekening Bank
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          Atur rekening bank Warungpedia untuk menerima pembayaran transfer.
        </p>
      </div>
      <Card className="p-6">
        <BankSettingsForm settings={settings} />
      </Card>
    </div>
  )
}
