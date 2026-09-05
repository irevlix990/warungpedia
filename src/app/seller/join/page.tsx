import Link from 'next/link'
import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth/dal'
import { redirect } from 'next/navigation'
import { ScrollReveal } from '@/components/ui'
import {
  TrendingUp,
  Zap,
  ShieldCheck,
  BarChart3,
  Headphones,
  Megaphone,
  CheckCircle2,
  Store,
  FileText,
  MapPin,
  Award,
  ArrowRight,
  Sparkles,
  Users,
  Package,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Gabung Bersama Kami — Jual di Warungpedia',
  description:
    'Jadilah penjual di Warungpedia. Jangkau jutaan pembeli di seluruh Indonesia dengan mudah, aman, dan cepat.',
}

const BENEFITS = [
  {
    icon: TrendingUp,
    titleKey: 'benefitReach',
    descKey: 'benefitReachDesc',
    color: 'from-brand-500 to-brand-700',
  },
  {
    icon: Zap,
    titleKey: 'benefitEasy',
    descKey: 'benefitEasyDesc',
    color: 'from-amber-400 to-orange-500',
  },
  {
    icon: ShieldCheck,
    titleKey: 'benefitSecure',
    descKey: 'benefitSecureDesc',
    color: 'from-emerald-400 to-teal-600',
  },
  {
    icon: BarChart3,
    titleKey: 'benefitAnalytics',
    descKey: 'benefitAnalyticsDesc',
    color: 'from-sky-400 to-blue-600',
  },
  {
    icon: Headphones,
    titleKey: 'benefitSupport',
    descKey: 'benefitSupportDesc',
    color: 'from-pink-400 to-rose-500',
  },
  {
    icon: Megaphone,
    titleKey: 'benefitPromo',
    descKey: 'benefitPromoDesc',
    color: 'from-violet-400 to-purple-600',
  },
]

const REQUIREMENTS = [
  {
    icon: Store,
    titleKey: 'reqAccount',
    descKey: 'reqAccountDesc',
  },
  {
    icon: FileText,
    titleKey: 'reqIdentity',
    descKey: 'reqIdentityDesc',
  },
  {
    icon: MapPin,
    titleKey: 'reqLocation',
    descKey: 'reqLocationDesc',
  },
  {
    icon: Award,
    titleKey: 'reqCommitment',
    descKey: 'reqCommitmentDesc',
  },
]

const STEPS = [
  { icon: FileText, titleKey: 'step1Title', descKey: 'step1Desc', num: '01' },
  { icon: ShieldCheck, titleKey: 'step2Title', descKey: 'step2Desc', num: '02' },
  { icon: Store, titleKey: 'step3Title', descKey: 'step3Desc', num: '03' },
]

export default async function SellerJoinPage() {
  const t = getDictionary()
  const user = await getCurrentUser()

  // If the user is already a seller, send them to their dashboard.
  if (user && user.role !== 'BUYER') {
    redirect('/seller')
  }

  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-brand-200/40 bg-gradient-to-br from-brand-50 via-brand-100/60 to-blossom/30 dark:from-brand-950/60 dark:via-neutral-950 dark:to-brand-900/20">
        {/* Floating decorations */}
        <div
          className="pointer-events-none absolute inset-0 select-none overflow-hidden"
          aria-hidden="true"
        >
          <span className="absolute left-[6%] top-[18%] text-4xl opacity-20 animate-float-slow sm:text-5xl">🏪</span>
          <span className="absolute right-[10%] top-[15%] text-3xl opacity-15 animate-float-medium sm:text-4xl">📈</span>
          <span className="absolute bottom-[18%] left-[18%] text-3xl opacity-10 animate-float-medium sm:text-4xl">💰</span>
          <span className="absolute bottom-[22%] right-[15%] text-4xl opacity-15 animate-float-slow sm:text-5xl">🚀</span>
          <span className="absolute left-[42%] top-[10%] text-2xl opacity-10 animate-float-fast sm:text-3xl">✨</span>
          <span className="absolute bottom-[12%] right-[38%] text-3xl opacity-10 animate-float-fast">🇮🇩</span>
          <div className="absolute right-[6%] top-[12%] size-2 rounded-full bg-brand-400/30" />
          <div className="absolute left-[14%] bottom-[18%] size-3 rounded-full bg-blossom/40" />
          <div className="absolute right-[28%] bottom-[8%] size-1.5 rounded-full bg-lilac/40" />
        </div>

        <div className="container-wp relative z-10 flex flex-col items-center gap-7 py-20 text-center sm:py-24 md:py-28">
          <ScrollReveal>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold text-brand-800 shadow-xs backdrop-blur-sm dark:bg-brand-900/60 dark:text-brand-200">
              <Sparkles className="size-3.5 text-brand-500" />
              {t.seller.joinBadge}
            </span>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-5xl lg:text-6xl">
              {t.seller.joinTitle}{' '}
              <span className="bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 bg-clip-text text-transparent dark:from-brand-300 dark:via-brand-400 dark:to-brand-500">
                Warungpedia
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="max-w-2xl text-base text-neutral-600 dark:text-neutral-300 sm:text-lg">
              {t.seller.joinSubtitle}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/seller/apply"
                className="group inline-flex h-13 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-600/25 transition-all hover:from-brand-700 hover:to-brand-800 hover:shadow-xl hover:shadow-brand-600/35 hover:-translate-y-0.5"
              >
                {t.seller.joinCta}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {t.seller.joinCtaHint}
              </span>
            </div>
          </ScrollReveal>

          {/* Stats */}
          <ScrollReveal delay={400}>
            <div className="mt-4 grid w-full max-w-2xl grid-cols-3 gap-3 sm:gap-4">
              {[
                { icon: Store, label: t.seller.statsStores, value: '10K+' },
                { icon: Package, label: t.seller.statsProducts, value: '1M+' },
                { icon: Users, label: t.seller.statsBuyers, value: '5M+' },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 rounded-2xl border border-white/60 bg-white/70 px-3 py-4 shadow-soft backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-900/70"
                >
                  <Icon className="size-5 text-brand-600 dark:text-brand-400" />
                  <span className="font-display text-xl font-extrabold text-neutral-900 dark:text-neutral-50 sm:text-2xl">
                    {value}
                  </span>
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────────────────── */}
      <section className="container-wp py-16 sm:py-20">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-3xl">
              {t.seller.benefitsTitle}
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 sm:text-base">
              {t.seller.benefitsSubtitle}
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, titleKey, descKey, color }, i) => (
            <ScrollReveal key={titleKey} delay={i * 80}>
              <div className="group h-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card dark:border-neutral-800 dark:bg-neutral-900">
                <div
                  className={`mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}
                >
                  <Icon className="size-6" />
                </div>
                <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
                  {t.seller[titleKey as keyof typeof t.seller]}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {t.seller[descKey as keyof typeof t.seller]}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Requirements ─────────────────────────────────────── */}
      <section className="border-y border-neutral-200 bg-neutral-100/60 py-16 dark:border-neutral-800 dark:bg-neutral-900/40 sm:py-20">
        <div className="container-wp">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-3xl">
                {t.seller.requirementsTitle}
              </h2>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 sm:text-base">
                {t.seller.requirementsSubtitle}
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REQUIREMENTS.map(({ icon: Icon, titleKey, descKey }, i) => (
              <ScrollReveal key={titleKey} delay={i * 80}>
                <div className="flex h-full flex-col items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex items-center gap-2">
                    <Icon className="size-5 text-brand-600 dark:text-brand-400" />
                    <h3 className="font-display text-sm font-bold text-neutral-900 dark:text-neutral-50">
                      {t.seller[titleKey as keyof typeof t.seller]}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {t.seller[descKey as keyof typeof t.seller]}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="container-wp py-16 sm:py-20">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-3xl">
              {t.seller.howItWorksTitle}
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 sm:text-base">
              {t.seller.howItWorksSubtitle}
            </p>
          </div>
        </ScrollReveal>

        <div className="relative mt-12 grid gap-8 sm:grid-cols-3">
          {/* Connector line (desktop) */}
          <div
            className="absolute left-[16%] right-[16%] top-7 hidden h-0.5 bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200 sm:block dark:from-brand-800 dark:via-brand-500 dark:to-brand-800"
            aria-hidden="true"
          />
          {STEPS.map(({ icon: Icon, titleKey, descKey, num }, i) => (
            <ScrollReveal key={num} delay={i * 120}>
              <div className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-4 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/25">
                  <Icon className="size-7" />
                  <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-neutral-900 text-[10px] font-bold text-white dark:bg-neutral-50 dark:text-neutral-900">
                    {num}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-50">
                  {t.seller[titleKey as keyof typeof t.seller]}
                </h3>
                <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {t.seller[descKey as keyof typeof t.seller]}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Testimonial ──────────────────────────────────────── */}
      <section className="border-t border-neutral-200 bg-gradient-to-br from-brand-50 via-white to-blossom/20 py-16 dark:border-neutral-800 dark:from-brand-950/40 dark:via-neutral-950 dark:to-brand-900/20 sm:py-20">
        <div className="container-wp">
          <ScrollReveal>
            <figure className="mx-auto max-w-3xl text-center">
              <div className="mb-4 flex justify-center gap-1 text-amber-400">
                {'★★★★★'.split('').map((s, i) => (
                  <span key={i} className="text-xl">
                    {s}
                  </span>
                ))}
              </div>
              <blockquote className="font-display text-lg font-semibold leading-relaxed text-neutral-800 dark:text-neutral-100 sm:text-xl">
                &ldquo;{t.seller.testimonialQuote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                {t.seller.testimonialAuthor}
              </figcaption>
            </figure>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="container-wp py-16 sm:py-20">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-14 text-center shadow-card sm:px-12">
            {/* Decorative */}
            <div
              className="pointer-events-none absolute inset-0 select-none"
              aria-hidden="true"
            >
              <span className="absolute left-[8%] top-[20%] text-3xl opacity-20 animate-float-slow">🏪</span>
              <span className="absolute right-[10%] top-[25%] text-2xl opacity-20 animate-float-medium">🚀</span>
              <span className="absolute bottom-[15%] left-[20%] text-2xl opacity-15 animate-float-fast">💰</span>
              <span className="absolute bottom-[20%] right-[18%] text-3xl opacity-20 animate-float-slow">✨</span>
            </div>

            <div className="relative z-10">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {t.seller.joinTitle} 🎉
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-brand-100 sm:text-base">
                {t.seller.joinSubtitle}
              </p>
              <div className="mt-8 flex flex-col items-center gap-3">
                <Link
                  href="/seller/apply"
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-brand-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {t.seller.joinCta}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <span className="flex items-center gap-1.5 text-xs font-medium text-brand-100/90">
                  <CheckCircle2 className="size-3.5" />
                  {t.seller.joinCtaHint}
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  )
}