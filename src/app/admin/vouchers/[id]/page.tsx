import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { getVoucherById } from '@/services/promotions-service'
import { VoucherForm } from '@/components/features/promotions/voucher-form'
import { Card } from '@/components/ui'

interface VoucherEditPageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Ubah Kupon | Warungpedia',
}

export default async function AdminVoucherEditPage({
  params,
}: VoucherEditPageProps) {
  const t = getDictionary()
  const { id } = await params
  const voucher = await getVoucherById(id).catch(() => null)
  if (!voucher) notFound()

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
        {t.promotions.editVoucher}
      </h2>
      <Card className="p-6">
        <VoucherForm t={t.promotions} voucher={voucher} />
      </Card>
    </div>
  )
}