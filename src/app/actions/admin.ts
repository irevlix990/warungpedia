'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission, requireSuperAdmin } from '@/lib/auth/dal'
import {
  categorySchema,
  moderateProductSchema,
  setReviewStatusSchema,
  setUserRoleSchema,
  settingUpsertSchema,
  siteSettingsSchema,
} from '@/lib/validation/admin'
import {
  createCategory,
  moderateProduct,
  setAdminUserRole,
  setCategoryActive,
  setSiteSetting,
  updateCategory,
} from '@/services/admin-service'
import { setReviewHidden } from '@/services/social-service'
import {
  purgeCategoryCache,
  purgeProductCache,
} from '@/config/cache-tags'

export interface AdminActionState {
  errors?: Record<string, string[] | undefined>
  message?: string
  success?: boolean
}

/** Super-admin: assign a role to a user. */
export async function setUserRoleAction(
  _state: AdminActionState | undefined,
  formData: FormData
) {
  await requireSuperAdmin()
  const parsed = setUserRoleSchema.safeParse({
    userId: formData.get('userId')?.toString(),
    role: formData.get('role')?.toString(),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  try {
    await setAdminUserRole(parsed.data.userId, parsed.data.role)
  } catch (error) {
    return { message: (error as Error).message }
  }
  revalidatePath('/admin/users')
  return { success: true }
}

/** Admin: moderate a product's status / featured flag. */
export async function moderateProductAction(
  _state: AdminActionState | undefined,
  formData: FormData
) {
  await requirePermission('MODERATE_PRODUCTS')
  const parsed = moderateProductSchema.safeParse({
    productId: formData.get('productId')?.toString(),
    status: formData.get('status')?.toString() || undefined,
    featured: formData.get('featured')?.toString() || undefined,
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  try {
    await moderateProduct(parsed.data.productId, {
      status: parsed.data.status,
      featured: parsed.data.featured,
    })
  } catch (error) {
    return { message: (error as Error).message }
  }
  revalidatePath('/admin/products')
  revalidatePath('/search')
  purgeProductCache()
  return { success: true }
}

/** Admin: hide or restore a product review. */
export async function setReviewStatusAction(
  _state: AdminActionState | undefined,
  formData: FormData
) {
  await requirePermission('MODERATE_PRODUCTS')
  const parsed = setReviewStatusSchema.safeParse({
    reviewId: formData.get('reviewId')?.toString(),
    status: formData.get('status')?.toString(),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  try {
    await setReviewHidden(parsed.data.reviewId, parsed.data.status === 'HIDDEN')
  } catch (error) {
    return { message: (error as Error).message }
  }
  revalidatePath('/admin/reviews')
  revalidatePath('/store/[slug]/product/[productSlug]', 'page')
  purgeProductCache()
  return { success: true }
}

/** Admin: create or update a category. */
export async function categoryUpsertAction(
  _state: AdminActionState | undefined,
  formData: FormData
) {
  await requirePermission('MANAGE_CMS')
  const parsed = categorySchema.safeParse({
    id: formData.get('id')?.toString() || undefined,
    name: formData.get('name')?.toString(),
    slug: formData.get('slug')?.toString(),
    description: formData.get('description')?.toString() || undefined,
    parentId: formData.get('parentId')?.toString() || undefined,
    sortOrder: formData.get('sortOrder')?.toString() || '0',
    imageUrl: formData.get('imageUrl')?.toString() || undefined,
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  try {
    if (parsed.data.id) {
      await updateCategory(parsed.data.id, parsed.data)
    } else {
      await createCategory(parsed.data)
    }
  } catch (error) {
    return { message: (error as Error).message }
  }
  revalidatePath('/admin/categories')
  revalidatePath('/categories')
  revalidatePath('/')
  purgeCategoryCache()
  return { success: true }
}

/** Admin: toggle a category active/inactive. */
export async function setCategoryActiveAction(formData: FormData): Promise<void> {
  await requirePermission('MANAGE_CMS')
  const id = formData.get('id')?.toString()
  const active = formData.get('active')?.toString() === '1'
  if (!id) return
  try {
    await setCategoryActive(id, active)
  } catch {
    return
  }
  revalidatePath('/admin/categories')
  revalidatePath('/categories')
  revalidatePath('/')
  purgeCategoryCache()
}

/** Admin: save the public-site settings CMS block. */
export async function saveSiteSettingsAction(
  _state: AdminActionState | undefined,
  formData: FormData
) {
  await requirePermission('MANAGE_CMS')
  const parsed = siteSettingsSchema.safeParse({
    siteName: formData.get('siteName')?.toString(),
    tagline: formData.get('tagline')?.toString() || '',
    supportEmail: formData.get('supportEmail')?.toString() || '',
    about: formData.get('about')?.toString() || '',
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  try {
    await setSiteSetting('site.name', parsed.data.siteName, 'Nama situs')
    await setSiteSetting('site.tagline', parsed.data.tagline, 'Tagline situs')
    await setSiteSetting('site.support_email', parsed.data.supportEmail, 'Email dukungan')
    await setSiteSetting('site.about', parsed.data.about, 'Tentang situs')
  } catch (error) {
    return { message: (error as Error).message }
  }
  revalidatePath('/admin/cms')
  revalidatePath('/')
  return { success: true }
}

/** Admin: generic key/value setting upsert. */
export async function settingUpsertAction(formData: FormData): Promise<void> {
  await requirePermission('MANAGE_CMS')
  const parsed = settingUpsertSchema.safeParse({
    key: formData.get('key')?.toString(),
    value: formData.get('value')?.toString(),
    description: formData.get('description')?.toString() || undefined,
  })
  if (!parsed.success) return
  try {
    await setSiteSetting(parsed.data.key, parsed.data.value, parsed.data.description ?? null)
  } catch {
    return
  }
  revalidatePath('/admin/cms')
}
