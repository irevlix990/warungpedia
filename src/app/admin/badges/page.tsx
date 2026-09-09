import { Suspense } from 'react'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { BuyerBadgeForm } from '@/components/features/admin/buyer-badge-form'
import { SellerBadgeForm } from '@/components/features/admin/seller-badge-form'
import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { SellerBadgeDisplay } from '@/components/ui/seller-badge'
import { BuyerBadgeDisplay } from '@/components/ui/buyer-badge'
import type { BuyerBadge } from '@/types/payment'
import type { SellerBadge } from '@/types/store'

export const metadata: Metadata = {
  title: 'Badge Management',
}

interface BadgeRow {
  id: string
  full_name: string | null
  email: string | null
  buyer_badge: BuyerBadge | null
}

interface SellerBadgeRow {
  id: string
  name: string | null
  badge: SellerBadge | null
}

async function getSellerBadgeData(): Promise<SellerBadgeRow[]> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('stores')
    .select('id, name, badge')
    .order('name')
  return (data ?? []) as SellerBadgeRow[]
}

async function getBuyerBadgeData(): Promise<BadgeRow[]> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, buyer_badge')
    .eq('role', 'BUYER')
    .order('full_name')
  const buyers = (data ?? []).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    email: null,
    buyer_badge: row.buyer_badge ?? null,
  }))
  return buyers as BadgeRow[]
}




export default async function BadgeManagementPage() {
  const sellers = await getSellerBadgeData()
  const buyers = await getBuyerBadgeData()

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold">Badge Management</h1>

      {/* Seller badges */}
      <Card className="p-4">
        <h2 className="mb-2 font-semibold">Seller Badge</h2>
        <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
          Badge seller diatur secara manual oleh admin melalui SQL atau form edit seller (OFFICIAL, MALL, STAR).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="pb-2 pr-4">Nama Toko</th>
                <th className="pb-2 pr-4">Badge</th>
                <th className="pb-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{s.name ?? '-'}</td>
                  <td className="py-2 pr-4">
                    <SellerBadgeDisplay badge={s.badge} />
                  </td>
                  <td className="py-2">
                    <Suspense fallback={<span>...</span>}>
                      <SellerBadgeForm storeId={s.id} currentBadge={s.badge} />
                    </Suspense>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sellers.length === 0 && (
            <p className="py-8 text-center text-neutral-400">Tidak ada toko.</p>
          )}
        </div>
      </Card>

      {/* Buyer badges */}
      <Card className="p-4">
        <h2 className="mb-3 font-semibold">Buyer Badge</h2>
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          Atur badge untuk buyer: Bronze, Silver, Gold, Platinum, VIP.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="pb-2 pr-4">Nama</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Badge</th>
                <th className="pb-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{b.full_name ?? '-'}</td>
                  <td className="py-2 pr-4 text-neutral-500">{b.email}</td>
                  <td className="py-2 pr-4"><BuyerBadgeDisplay badge={b.buyer_badge} /></td>
                  <td className="py-2">
                    <Suspense fallback={<span>...</span>}>
                      <BuyerBadgeForm userId={b.id} currentBadge={b.buyer_badge} />
                    </Suspense>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {buyers.length === 0 && (
            <p className="py-8 text-center text-neutral-400">Belum ada buyer terdaftar.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
