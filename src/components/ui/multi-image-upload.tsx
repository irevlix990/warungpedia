'use client'

import * as React from 'react'
import { Loader2, X, UploadCloud } from 'lucide-react'
import { uploadImage, deleteImage } from '@/lib/supabase/upload'
import { cn } from '@/utils/cn'

interface ImageEntry {
  url: string
  path: string
}

interface MultiImageUploadProps {
  /** Hidden input name — the comma-separated URL list is written here. */
  name: string
  /** Bucket to upload into. */
  bucket: 'stores' | 'products'
  /** Path prefix inside the bucket (typically the storeId). */
  prefix: string
  /** Initial URLs (existing images). */
  value?: string[]
  /** Max number of images. */
  max?: number
  /** Label shown above the upload area. */
  label?: string
  /** Called with the new URL list after changes. */
  onChange?: (urls: string[]) => void
  className?: string
}

/**
 * Multi-image upload with preview grid.
 *
 * Shows upload slots for up to `max` images. Each slot opens the OS file
 * dialog, uploads to Supabase Storage, and adds the URL to the list.
 */
export function MultiImageUpload({
  name,
  bucket,
  prefix,
  value = [],
  max = 8,
  label,
  onChange,
  className,
}: MultiImageUploadProps) {
  const [entries, setEntries] = React.useState<ImageEntry[]>(
    value.map((url) => ({ url, path: '' }))
  )
  const [uploadingIdx, setUploadingIdx] = React.useState<number | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const urls = entries.map((e) => e.url).filter(Boolean)
  const canAdd = urls.length < max

  const emitChange = (next: ImageEntry[]) => {
    setEntries(next)
    onChange?.(next.map((e) => e.url).filter(Boolean))
  }

  const handleFile = async (file: File | undefined, idx: number) => {
    if (!file) return
    setUploadingIdx(idx)
    setError(null)
    try {
      const result = await uploadImage(file, bucket, prefix)
      const next = [...entries]
      next[idx] = { url: result.url, path: result.path }
      emitChange(next)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploadingIdx(null)
    }
  }

  const remove = async (idx: number) => {
    const entry = entries[idx]
    if (entry?.path) {
      try {
        await deleteImage(bucket, entry.path)
      } catch {
        // best-effort cleanup
      }
    }
    const next = entries.filter((_, i) => i !== idx)
    emitChange(next)
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {label}
          <span className="ml-1 text-neutral-400">
            ({urls.length}/{max})
          </span>
        </span>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          const nextEmpty = entries.findIndex((e) => !e.url)
          const idx = nextEmpty >= 0 ? nextEmpty : entries.length
          if (idx < max) {
            const next = [...entries]
            next[idx] = { url: '', path: '' }
            setEntries(next)
            handleFile(file, idx)
          }
          e.target.value = ''
        }}
      />

      <input type="hidden" name={name} value={urls.join(',')} />

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {entries.map((entry, idx) => (
          <div
            key={idx}
            className="group relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800"
          >
            {entry.url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.url}
                  alt={`Gambar ${idx + 1}`}
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="inline-flex items-center gap-1 rounded-lg bg-danger-600/90 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-danger-600"
                  >
                    <X className="size-3" />
                    Hapus
                  </button>
                </div>
                {idx === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    Utama
                  </span>
                )}
              </>
            ) : uploadingIdx === idx ? (
              <div className="flex size-full flex-col items-center justify-center gap-1">
                <Loader2 className="size-5 animate-spin text-brand-500" />
                <span className="text-[10px] text-neutral-400">Upload...</span>
              </div>
            ) : null}
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploadingIdx !== null}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 transition-colors hover:border-brand-500 hover:bg-brand-50/50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-brand-500 dark:hover:bg-brand-950/30 dark:hover:text-brand-300"
          >
            <UploadCloud className="size-5" />
            <span className="text-[10px] font-medium">Tambah</span>
          </button>
        )}
      </div>

      {error ? (
        <p className="text-xs text-danger-600 dark:text-danger-400">{error}</p>
      ) : null}
    </div>
  )
}
