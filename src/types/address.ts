/**
 * Serializable shipping-address shape used across the account pages and
 * client components. Mirrors the `public.addresses` table row minus server
 * audit columns not needed by the UI.
 */
export interface Address {
  id: string
  label: string
  recipientName: string
  phone: string
  street: string
  district: string | null
  city: string
  province: string
  postalCode: string | null
  country: string
  isDefault: boolean
}
