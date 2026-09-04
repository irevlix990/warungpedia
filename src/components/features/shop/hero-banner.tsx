import Link from 'next/link'
import { getDictionary } from '@/lib/i18n'

/**
 * Hero banner section for the homepage.
 * A visually rich, brand-forward section with gradient background,
 * floating emoji decorations, and animated entrance.
 */
export function HeroBanner() {
  const t = getDictionary()

  return (
    <section className="relative overflow-hidden border-b border-brand-200/40 bg-gradient-to-br from-brand-50 via-brand-100/60 to-blossom/30 dark:from-brand-950/60 dark:via-neutral-950 dark:to-brand-900/20">
      {/* Floating emoji decorations */}
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden" aria-hidden="true">
        <span className="absolute left-[8%] top-[15%] text-4xl opacity-20 animate-float-slow sm:text-5xl">🏪</span>
        <span className="absolute right-[12%] top-[20%] text-3xl opacity-15 animate-float-medium sm:text-4xl">🛍️</span>
        <span className="absolute bottom-[15%] left-[20%] text-2xl opacity-10 animate-float-medium sm:text-3xl">📦</span>
        <span className="absolute bottom-[25%] right-[18%] text-4xl opacity-15 animate-float-slow sm:text-5xl">🎉</span>
        <span className="absolute left-[45%] top-[8%] text-2xl opacity-10 animate-float-fast sm:text-3xl">✨</span>
        <span className="absolute bottom-[10%] right-[40%] text-3xl opacity-10 animate-float-fast">🇮🇩</span>
        {/* Decorative dots */}
        <div className="absolute right-[6%] top-[10%] size-2 rounded-full bg-brand-400/30" />
        <div className="absolute left-[15%] bottom-[20%] size-3 rounded-full bg-blossom/40" />
        <div className="absolute right-[30%] bottom-[10%] size-1.5 rounded-full bg-lilac/40" />
      </div>

      <div className="container-wp relative z-10 flex flex-col items-center gap-8 py-20 text-center sm:py-28 md:py-32">
        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold text-brand-800 shadow-xs backdrop-blur-sm dark:bg-brand-900/60 dark:text-brand-200">
          <span className="size-1.5 rounded-full bg-brand-500 animate-pulse" />
          Marketplace Multi-Penjual #1 di Indonesia
        </span>

        {/* Main heading */}
        <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-5xl lg:text-6xl">
          Belanja Lebih Mudah{' '}
          <span className="bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 bg-clip-text text-transparent dark:from-brand-300 dark:via-brand-400 dark:to-brand-500">
            Bersama Warung
          </span>
          <br className="hidden sm:block" />
          <span className="text-brand-600 dark:text-brand-400">pedia</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-xl text-base text-neutral-600 dark:text-neutral-300 sm:text-lg">
          {t.home.heroDescription}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/categories"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-7 text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition-all hover:from-brand-700 hover:to-brand-800 hover:shadow-xl hover:shadow-brand-600/30 hover:-translate-y-0.5"
          >
            🛒 Mulai Belanja
          </Link>
          <Link
            href="/search"
            className="inline-flex h-12 items-center gap-2 rounded-xl border-2 border-neutral-300 bg-white/60 px-7 text-sm font-bold text-neutral-800 backdrop-blur-sm transition-all hover:border-brand-500 hover:bg-white hover:shadow-sm hover:-translate-y-0.5 dark:border-neutral-600 dark:bg-neutral-800/60 dark:text-neutral-100 dark:hover:border-brand-500 dark:hover:bg-neutral-800"
          >
            🔍 Cari Produk
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <span className="text-brand-500">✓</span> Pengiriman Seluruh Indonesia
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-brand-500">✓</span> Pembayaran Aman & Terpercaya
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-brand-500">✓</span> Jaminan Uang Kembali
          </span>
        </div>
      </div>
    </section>
  )
}
