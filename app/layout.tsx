import type { Metadata } from 'next'
import { Noto_Sans, Roboto_Mono } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const notoSans = Noto_Sans({ subsets: ['latin'], weight: ['400', '600', '700'], display: 'swap', variable: '--font-noto-sans' })
const robotoMono = Roboto_Mono({ subsets: ['latin'], weight: ['500'], display: 'swap', variable: '--font-roboto-mono' })

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

export const metadata: Metadata = {
  title: { default: 'NiftyPulse360 — Indian Stock Market News & Analysis', template: '%s | NiftyPulse360' },
  description: 'Real-time Indian stock market updates. Find out why stocks rose or fell today with news, analysis and expert views.',
  metadataBase: new URL(SITE),
  applicationName: 'NiftyPulse360',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  authors: [{ name: 'Market Data Desk', url: `${SITE}/authors/market-desk` }],
  publisher: 'NiftyPulse360',
  category: 'finance',
  keywords: ['Indian stock market', 'NSE', 'BSE', 'Nifty 50', 'Sensex', 'stock news', 'why stock rose', 'why stock fell', 'gold price', 'commodity prices'],
  formatDetection: { telephone: false, address: false, email: false },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': [{ url: '/feed.xml', title: 'NiftyPulse360 RSS Feed' }],
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NiftyPulse360',
    url: SITE,
  },
  twitter: {
    card: 'summary_large_image',
    site: '@niftypulse360',
    creator: '@niftypulse360',
  },
  other: {
    'rating': 'general',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    '@id': `${SITE}/#organization`,
    name: 'NiftyPulse360',
    url: SITE,
    logo: { '@type': 'ImageObject', url: `${SITE}/logo.svg`, width: 600, height: 60 },
    sameAs: [
      'https://x.com/bhamre61968',
      'https://www.linkedin.com/in/ankit-bhamre-a82b58343/',
      'https://dev.to/niftypulse360',
    ],
    diversityPolicy: `${SITE}/editorial-guidelines`,
    ethicsPolicy: `${SITE}/editorial-guidelines`,
    masthead: `${SITE}/about`,
    missionCoveragePrioritiesPolicy: `${SITE}/methodology`,
    correctionsPolicy: `${SITE}/corrections-policy`,
    foundingDate: '2026-05',
    knowsAbout: ['Indian Stock Market', 'NSE', 'BSE', 'Nifty 50', 'Sensex', 'Equity Markets', 'Commodity Markets', 'Currency Markets'],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    name: 'NiftyPulse360',
    url: SITE,
    publisher: { '@id': `${SITE}/#organization` },
    inLanguage: 'en-IN',
    // No SearchAction: there is no /search route, so the sitelinks search box would
    // send users (and Google's validator) to a 404.
  }

  return (
    <html lang="en-IN">
      <head>
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />
        <meta name="google-site-verification" content="Gp64e-hXtGzB7HQOV5DwUQSio69pEJ2c8d_vKjXGdNM" />
        <meta name="p:domain_verify" content="3a2c36fc6bc5f657ec631850fef56b4d" />
        <meta name="googlebot-news" content="index, follow" />
        <meta name="theme-color" content="#1565C0" />
        <link rel="alternate" type="application/rss+xml" title="NiftyPulse360 RSS Feed" href="/feed.xml" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={`${notoSans.variable} ${robotoMono.variable} bg-gray-50 text-gray-900`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
