import { createClient } from '@/lib/supabase/client'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

export interface UploadResult {
  url: string
  path: string
}

/**
 * Upload a file to a Supabase Storage bucket.
 *
 * @param file   - The file to upload
 * @param bucket - Bucket name ('stores', 'products', or 'avatars')
 * @param prefix - Path prefix inside the bucket (e.g. userId or storeId)
 * @returns Public URL and storage path
 */
export async function uploadImage(
  file: File,
  bucket: 'stores' | 'products' | 'avatars',
  prefix: string
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Format gambar tidak didukung. Gunakan PNG, JPEG, WebP, atau GIF.')
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Ukuran gambar maksimal 5 MB.')
  }

  const supabase = createClient()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `${prefix}/${fileName}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw new Error(`Gagal mengunggah gambar: ${error.message}`)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)

  return { url: data.publicUrl, path }
}

/**
 * Delete an image from a Supabase Storage bucket.
 */
export async function deleteImage(
  bucket: 'stores' | 'products' | 'avatars',
  path: string
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    throw new Error(`Gagal menghapus gambar: ${error.message}`)
  }
}
