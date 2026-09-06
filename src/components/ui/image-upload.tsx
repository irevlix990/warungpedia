'use client'

import * as React from 'react'
import { ImagePlus, Loader2, X, UploadCloud } from 'lucide-react'
import { uploadImage } from '@/lib/supabase/upload'
import { cn } from '@/utils/cn'

interface ImageUploadProps {
  /** Hidden input name — the uploaded public URL is written here. */
  name: string
  /** Bucket to upload into. */
  bucket: 'stores' | 'products' | 'avatars'
  /** Path prefix inside the bucket (userId or storeId). */
  prefix: string
  /** Initial value (existing URL). */
  value?: string
  /** Label shown above the dropzone. */
  label?: string
  /** Aspect ratio hint for the preview box. */
  aspect?: 'square' | 'wide'
  /** Called with the new URL after a successful upload. */
  onChange?: (url: string) => void
  className?: string
}

/**
 * File-picker image upload with preview.
 *
 * Clicking the box opens the OS file dialog. On selection the file is
 * uploaded to Supabase Storage and the resulting public URL is written to
 * the hidden input (and reported via onChange).
 */
export function ImageUpload({
  name,
  bucket,
  prefix,
  value,
  label,
  aspect = 'square',
  onChange,
  className,
}: ImageUploadProps) {
  const [url, setUrl] = React.useState(value ?? '')
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const { url: publicUrl } = await uploadImage(file, bucket, prefix)
      setUrl(publicUrl)
      onChange?.(publicUrl)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const clear = () => {
    setUrl('')
    onChange?.('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {label}
        </span>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <input type="hidden" name={name} value={url} />

      {url ? (
        <div
          className={cn(
            'group relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800',
            aspect === 'wide' ? 'aspect-[16/6]' : 'aspect-square'
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={label ?? 'Gambar'}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-neutral-800 transition-colors hover:bg-white"
            >
              <ImagePlus className="size-3.5" />
              Ganti
            </button>
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1.5 rounded-lg bg-danger-600/90 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-danger-600"
            >
              <X className="size-3.5" />
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 transition-colors hover:border-brand-500 hover:bg-brand-50/50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-brand-500 dark:hover:bg-brand-950/30 dark:hover:text-brand-300',
            aspect === 'wide' ? 'aspect-[16/6]' : 'aspect-square'
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-6 animate-spin" />
              <span className="text-xs font-medium">Mengunggah...</span>
            </>
          ) : (
            <>
              <UploadCloud className="size-6" />
              <span className="text-xs font-medium">
                Klik untuk memilih gambar
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                PNG, JPG, WebP, GIF · maks 5 MB
              </span>
            </>
          )}
        </button>
      )}

      {error ? (
        <p className="text-xs text-danger-600 dark:text-danger-400">{error}</p>
      ) : null}
    </div>
  )
}