/**
 * Server-side validation schemas for shipping addresses.
 */
import { z } from 'zod'

export const addressSchema = z.object({
  label: z
    .string()
    .max(40, { message: 'Label maksimal 40 karakter.' })
    .trim()
    .default('Alamat'),
  recipientName: z
    .string()
    .min(2, { message: 'Nama penerima minimal 2 karakter.' })
    .max(100, { message: 'Nama penerima maksimal 100 karakter.' })
    .trim(),
  phone: z
    .string()
    .min(8, { message: 'Nomor telepon minimal 8 karakter.' })
    .max(20, { message: 'Nomor telepon maksimal 20 karakter.' })
    .trim(),
  street: z
    .string()
    .min(5, { message: 'Alamat jalan minimal 5 karakter.' })
    .max(255, { message: 'Alamat jalan maksimal 255 karakter.' })
    .trim(),
  district: z
    .string()
    .max(100, { message: 'Kecamatan maksimal 100 karakter.' })
    .trim()
    .optional()
    .nullable(),
  city: z
    .string()
    .min(2, { message: 'Kota wajib diisi.' })
    .max(100, { message: 'Kota maksimal 100 karakter.' })
    .trim(),
  province: z
    .string()
    .min(2, { message: 'Provinsi wajib diisi.' })
    .max(100, { message: 'Provinsi maksimal 100 karakter.' })
    .trim(),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, { message: 'Kode pos harus 5 digit angka.' })
    .optional()
    .nullable(),
  country: z
    .string()
    .max(100, { message: 'Negara maksimal 100 karakter.' })
    .trim()
    .default('Indonesia'),
  isDefault: z.boolean().default(false),
})

export type AddressInput = z.infer<typeof addressSchema>
