import { requireUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { getAddresses } from '@/services/profile-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AddressManager } from '@/components/features/account/address-manager'
import type { Address } from '@/types/address'

export default async function AddressesPage() {
  const t = getDictionary()
  const user = await requireUser()
  const rows = await getAddresses(user.id)

  const addresses: Address[] = rows.map((row) => ({
    id: row.id,
    label: row.label,
    recipientName: row.recipient_name,
    phone: row.phone,
    street: row.street,
    district: row.district,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    isDefault: row.is_default,
  }))

  return (
    <div className="mt-6 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.account.addressesTitle}</CardTitle>
          <CardDescription>{t.account.addressesSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <AddressManager t={t.account} addresses={addresses} />
        </CardContent>
      </Card>
    </div>
  )
}
