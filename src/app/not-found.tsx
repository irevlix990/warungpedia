import Link from 'next/link'
import { buttonVariants } from '@/components/ui'

export default function NotFoundPage() {
  return (
    <main className="container-wp flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-6xl font-extrabold text-brand-600 dark:text-brand-300">
        404
      </h1>
      <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-50">
        Halaman tidak ditemukan
      </h2>
      <p className="max-w-md text-neutral-600 dark:text-neutral-300">
        Halaman yang Anda cari mungkin telah dipindahkan atau tidak tersedia.
      </p>
      <Link href="/" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
        Kembali ke Beranda
      </Link>
    </main>
  )
}
