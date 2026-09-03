'use client'

import { useEffect } from 'react'
import { buttonVariants } from '@/components/ui'
import Link from 'next/link'

export default function GlobalErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="id">
      <body className="flex min-h-screen items-center justify-center bg-neutral-50 p-6 dark:bg-neutral-950">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Terjadi kendala
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Maaf, terjadi masalah tak terduga. Silakan coba lagi.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              className={buttonVariants({ variant: 'primary' })}
              onClick={retry}
            >
              Coba lagi
            </button>
            <Link href="/" className={buttonVariants({ variant: 'outline' })}>
              Beranda
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
