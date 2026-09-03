import { requireUser } from '@/lib/auth/dal'
import { getDictionary } from '@/lib/i18n'
import { getAddresses } from '@/services/profile-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AddressList } from '@/components/features/account/address-list'
import { AddressForm } from '@/components/features/account/address-form'
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
    isDefault: row.is_default,
  }))

  return (
    <div className="mt-6 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.account.addressesTitle}</CardTitle>
          <CardDescription>{t.account.addressesSubtitle}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {addresses.length === 0 ? (
            <p className="text-sm text-neutral-500">{t.account.noAddresses}</p>
          ) : (
            <AddressList t={t.account} addresses={addresses} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.account.addAddress}</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressForm t={t.account} />
        </CardContent>
      </Card>
    </div>
  )
}
