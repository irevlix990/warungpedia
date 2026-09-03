import type { Metadata, Viewport } from 'next'
import { Inter, Sora } from 'next/font/google'
import '@/styles/globals.css'
import { RootProviders } from '@/components/providers/root-providers'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { siteConfig } from '@/config/site'
import { absoluteUrl } from '@/lib/seo/seo'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — Belanja yang lebih mudah`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  generator: 'Warungpedia',
  keywords: [
    'belanja online',
    'marketplace indonesia',
    'jual beli',
    'warung',
    'produk lokal',
  ],
  authors: [{ name: 'Warungpedia' }],
  creator: 'Warungpedia',
  publisher: 'Warungpedia',
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: absoluteUrl('/') },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: `${siteConfig.name} — Belanja yang lebih mudah`,
    description: siteConfig.description,
    url: absoluteUrl('/'),
    siteName: siteConfig.name,
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — Belanja yang lebih mudah`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8C56D4',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${sora.variable}`}
    >
      <body className="min-h-screen antialiased">
        <RootProviders>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </RootProviders>
      </body>
    </html>
  )
}
