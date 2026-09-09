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
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
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

/**
 * Blocking pre-hydration theme bootstrap. Reads the saved preference (or the
 * OS preference for 'system') and applies .dark / color-scheme on <html>
 * before first paint, so SSR markup is consistent with what the client
 * hydrates (prevents hydration mismatch + FOUC).
 */
const themeScript = `(function(){try{var k='wp-theme',t=localStorage.getItem(k)||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
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
