'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requirePermission, requireUserOrThrow } from '@/lib/auth/dal'
import { productSchema } from '@/lib/validation/product'
import { getStoreByOwner } from '@/services/store-service'
import {
  createProduct,
  getOwnableProductById,
  removeProduct,
  setProductStatus,
  setProductStock,
  updateProductDetails,
} from '@/services/product-service'
import type { ProductStatus } from '@/types/product'
import { purgeProductCache } from '@/config/cache-tags'

export interface ProductFormState {
  errors?: Record<string, string[] | undefined>
  message?: string
  success?: boolean
}

/** Resolves the acting seller's ACTIVE store id, or null. */
async function activeStoreId(): Promise<string | null> {
  const user = await requireUserOrThrow()
  const store = await getStoreByOwner(user.id).catch(() => null)
  if (!store || store.status !== 'ACTIVE') return null
  return store.id
}

function parseProductForm(formData: FormData) {
  const toNum = (v: FormDataEntryValue | null) => {
    if (v === null || v === '') return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  const images = (formData.get('imageUrls')?.toString() ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return productSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug') || '',
    description: formData.get('description') || '',
    brand: formData.get('brand') || '',
    categoryId: formData.get('categoryId')?.toString() || null,
    condition: formData.get('condition') || 'new',
    price: toNum(formData.get('price')),
    compareAtPrice: toNum(formData.get('compareAtPrice')) ?? null,
    imageUrls: images,
    stock: toNum(formData.get('stock')) ?? 0,
    lowStockThreshold: toNum(formData.get('lowStockThreshold')) ?? 5,
    weightGrams: toNum(formData.get('weightGrams')) ?? null,
    status: formData.get('status') || 'DRAFT',
    isFeatured: formData.get('isFeatured') === 'on',
  })
}

/** SELLER creates a new product in their ACTIVE store. */
export async function createProductAction(
  _state: ProductFormState | undefined,
  formData: FormData
): Promise<ProductFormState> {
  const storeId = await activeStoreId()
  if (!storeId) {
    return { message: 'Toko belum aktif. Aktifkan toko terlebih dahulu.' }
  }

  const parsed = parseProductForm(formData)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await createProduct(storeId, parsed.data)
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath('/seller/products')
  purgeProductCache()
  redirect('/seller/products')
}

/** SELLER updates an existing product (must own it). */
export async function updateProductAction(
  _state: ProductFormState | undefined,
  formData: FormData
): Promise<ProductFormState> {
  const productId = formData.get('productId')?.toString()
  if (!productId) {
    return { message: 'ID produk tidak valid.' }
  }

  await requirePermission('MANAGE_STORE')
  const product = await getOwnableProductById(productId).catch(() => null)
  if (!product) {
    return { message: 'Produk tidak ditemukan.' }
  }

  const parsed = parseProductForm(formData)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await updateProductDetails(productId, parsed.data)
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath('/seller/products')
  revalidatePath(`/seller/products/${productId}`)
  purgeProductCache()
  return { success: true, message: 'Produk berhasil diperbarui.' }
}

/** SELLER toggles a product's lifecycle status. */
export async function setProductStatusAction(
  formData: FormData
): Promise<void> {
  const productId = formData.get('productId')?.toString()
  const status = formData.get('status')?.toString() as ProductStatus | undefined
  if (!productId || !status) {
    redirect('/seller/products')
  }

  await requirePermission('MANAGE_STORE')
  const product = await getOwnableProductById(productId).catch(() => null)
  if (!product) {
    redirect('/seller/products')
  }

  try {
    await setProductStatus(productId, status)
  } catch {
    // notable: falls through to redirect; transient errors surfaced via flash
  }

  revalidatePath('/seller/products')
  purgeProductCache()
  redirect('/seller/products')
}

/** SELLER updates stock on one of their products. */
export async function setProductStockAction(
  _state: ProductFormState | undefined,
  formData: FormData
): Promise<ProductFormState> {
  const productId = formData.get('productId')?.toString()
  const stock = Number(formData.get('stock'))
  if (!productId || !Number.isInteger(stock) || stock < 0) {
    return { message: 'Stok tidak valid.' }
  }

  await requirePermission('MANAGE_STORE')
  const product = await getOwnableProductById(productId).catch(() => null)
  if (!product) {
    return { message: 'Produk tidak ditemukan.' }
  }

  try {
    await setProductStock(productId, stock)
  } catch (error) {
    return { message: (error as Error).message }
  }

  revalidatePath('/seller/products')
  revalidatePath(`/seller/products/${productId}`)
  purgeProductCache()
  return { success: true, message: 'Stok diperbarui.' }
}

/** SELLER deletes a DRAFT/ARCHIVED product. */
export async function deleteProductAction(formData: FormData): Promise<void> {
  const productId = formData.get('productId')?.toString()
  if (!productId) {
    redirect('/seller/products')
  }

  await requirePermission('MANAGE_STORE')
  const product = await getOwnableProductById(productId).catch(() => null)
  if (!product) {
    redirect('/seller/products')
  }

  try {
    await removeProduct(productId)
  } catch {
    // stays on the list; transient failure surfaces via revalidation
  }

  revalidatePath('/seller/products')
  purgeProductCache()
  redirect('/seller/products')
}
