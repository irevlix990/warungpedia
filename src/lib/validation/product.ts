import { z } from 'zod'

const url = z.union([
  z.literal(''),
  z.string().trim().url({ message: 'URL tidak valid.' }),
])

const condition = z.enum(['new', 'used'], { message: 'Kondisi produk tidak valid.' })
const status = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'], { message: 'Status produk tidak valid.' })
const nonNegativeInt = (label: string, required = false) =>
  (required
    ? z.number({ message: `${label} wajib diisi dan berupa angka.` })
    : z.number({ message: `${label} harus berupa angka.` })
  )
    .int({ message: `${label} harus bilangan bulat.` })
    .min(0, { message: `${label} tidak boleh negatif.` })

/**
 * Validates a product create/edit submission. `slug` is optional: when blank
 * the app derives it from the product name via `slugify`. `compareAtPrice`
 * must exceed `price` to be meaningful (enforced with a refinement). Money is
 * integer IDR; stock and weight are non-negative integers.
 */
export const productSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, { message: 'Nama produk minimal 3 karakter.' })
      .max(160, { message: 'Nama produk maksimal 160 karakter.' }),
    slug: z
      .string()
      .trim()
      .max(160)
      .regex(
        /^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/,
        { message: 'Slug hanya boleh huruf kecil, angka, dan tanda hubung.' }
      ),
    description: z.string().trim().max(4000).optional(),
    brand: z.string().trim().max(80).optional(),
    categoryId: z.string().uuid().nullable().optional(),
    condition,
    price: nonNegativeInt('Harga', true),
    compareAtPrice: nonNegativeInt('Harga perbandingan').nullable().optional(),
    imageUrls: z
      .array(url, { message: 'Daftar gambar tidak valid.' })
      .max(8, { message: 'Maksimal 8 gambar.' })
      .optional(),
    stock: nonNegativeInt('Stok', true),
    lowStockThreshold: nonNegativeInt('Ambang stok').default(5),
    weightGrams: nonNegativeInt('Berat').nullable().optional(),
    status,
    isFeatured: z.boolean().optional(),
  })
  .refine(
    (data) => !data.compareAtPrice || data.compareAtPrice > data.price,
    {
      message: 'Harga perbandingan harus lebih besar dari harga jual.',
      path: ['compareAtPrice'],
    }
  )

export type ProductFormValues = z.infer<typeof productSchema>
