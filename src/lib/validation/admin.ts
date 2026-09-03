import { z } from 'zod'
import { ROLES } from '@/config/roles'

const roleEnum = z.enum([ROLES.BUYER, ROLES.SELLER, ROLES.ADMIN, ROLES.SUPER_ADMIN], {
  message: 'Peran tidak valid.',
})

const productStatus = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'], {
  message: 'Status produk tidak valid.',
})

/** Validates a user's role assignment. */
export const setUserRoleSchema = z.object({
  userId: z.uuid({ message: 'ID pengguna tidak valid.' }),
  role: roleEnum,
})

/** Validates a product moderation update (status and/or featured). */
export const moderateProductSchema = z.object({
  productId: z.uuid({ message: 'ID produk tidak valid.' }),
  status: productStatus.optional(),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
})

/** Validates review moderation (hide/restore). */
export const setReviewStatusSchema = z.object({
  reviewId: z.uuid({ message: 'ID ulasan tidak valid.' }),
  status: z.enum(['ACTIVE', 'HIDDEN'], {
    message: 'Status ulasan tidak valid.',
  }),
})

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Validates category create/update input. */
export const categorySchema = z.object({
  id: z.uuid().optional(),
  name: z
    .string({ message: 'Nama kategori harus berupa teks.' })
    .trim()
    .min(1, { message: 'Nama kategori wajib diisi.' })
    .max(80, { message: 'Nama kategori maksimal 80 karakter.' }),
  slug: z
    .string({ message: 'Slug harus berupa teks.' })
    .trim()
    .min(1, { message: 'Slug wajib diisi.' })
    .max(80, { message: 'Slug maksimal 80 karakter.' })
    .regex(slugRegex, {
      message: 'Slug hanya boleh huruf kecil, angka, dan tanda hubung.',
    }),
  description: z
    .string()
    .trim()
    .max(500, { message: 'Deskripsi maksimal 500 karakter.' })
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  parentId: z
    .uuid({ message: 'ID kategori induk tidak valid.' })
    .optional()
    .nullable()
    .transform((v) => v ?? null),
  sortOrder: z.coerce
    .number({ message: 'Urutan harus berupa angka.' })
    .int({ message: 'Urutan harus bilangan bulat.' })
    .min(0, { message: 'Urutan tidak boleh negatif.' })
    .default(0),
  imageUrl: z
    .string()
    .trim()
    .url({ message: 'URL gambar tidak valid.' })
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
})

/** Validates a single site-setting upsert. */
export const settingUpsertSchema = z.object({
  key: z.string().trim().min(1).max(80),
  value: z.string().max(2000),
  description: z.string().trim().max(255).optional().nullable(),
})

/** Validates the public-site settings CMS form. */
export const siteSettingsSchema = z.object({
  siteName: z
    .string({ message: 'Nama situs harus berupa teks.' })
    .trim()
    .min(1, { message: 'Nama situs wajib diisi.' })
    .max(80, { message: 'Nama situs maksimal 80 karakter.' }),
  tagline: z.string().trim().max(120).default(''),
  supportEmail: z
    .string()
    .trim()
    .email({ message: 'Email dukungan tidak valid.' })
    .default(''),
  about: z.string().trim().max(2000).default(''),
})
