import { z } from 'zod'

const urlOrEmpty = z.union([
  z.literal(''),
  z.string().trim().url('URL tidak valid'),
])

/**
 * Validates a store application / store settings submission. Slug is
 * optional: when blank the app derives it from the store name via `slugify`.
 */
export const storeSchema = z.object({
  name: z.string().trim().min(3, 'Nama toko minimal 3 karakter').max(60),
  slug: z
    .string()
    .trim()
    .max(60)
    .regex(
      /^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/,
      'Slug hanya boleh huruf kecil, angka, dan tanda hubung.'
    ),
  tagline: z.string().trim().max(120),
  description: z.string().trim().max(1000),
  contactEmail: z.string().trim().email('Email tidak valid').max(254),
  phone: z.string().trim().max(20),
  province: z.string().trim().min(2, 'Provinsi wajib diisi').max(100),
  city: z.string().trim().min(2, 'Kota / Kabupaten wajib diisi').max(100),
  logoUrl: urlOrEmpty,
  bannerUrl: urlOrEmpty,
})

export type StoreFormValues = z.infer<typeof storeSchema>