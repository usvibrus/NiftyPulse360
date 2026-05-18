import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'
import BreadCrumb from '@/components/ui/BreadCrumb'
import StructuredData from '@/components/seo/StructuredData'
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema'
import AdUnit from '@/components/ui/AdUnit'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  const commodity = await prisma.commodityEvent.findUnique({
    where: { slug },
    select: { metaTitle: true, metaDesc: true, slug: true, commodity: true, eventType: true, keywords: true, publishedAt: true, updatedAt: true },
  })
  if (commodity) {
    const ogImage = `${SITE}/api/og?title=${encodeURIComponent(commodity.metaTitle)}&symbol=${encodeURIComponent(commodity.commodity)}&type=${commodity.eventType}`
    const tags = [commodity.commodity.replace('_', ' '), 'Commodities', 'India', `${commodity.commodity.replace('_', ' ').toLowerCase()} price`]
    return {
      title: commodity.metaTitle,
      description: commodity.metaDesc,
      alternates: { canonical: `/commodities/${commodity.slug}` },
      keywords: [...(commodity.keywords || []), ...tags],
      authors: [{ name: 'Market Data Desk', url: `${SITE}/authors/market-desk` }],
      openGraph: {
        title: commodity.metaTitle, description: commodity.metaDesc, type: 'article',
        url: `${SITE}/commodities/${commodity.slug}`, siteName: 'NiftyPulse360', locale: 'en_IN',
        publishedTime: commodity.publishedAt.toISOString(), modifiedTime: commodity.updatedAt.toISOString(),
        authors: [`${SITE}/authors/market-desk`], section: 'Commodities', tags,
        images: [{ url: ogImage, width: 1200, height: 630, alt: commodity.metaTitle }],
      },
      twitter: { card: 'summary_large_image', title: commodity.metaTitle, description: commodity.metaDesc, images: [ogImage], creator: '@niftypulse360' },
      other: {
        'news_keywords': tags.join(', '),
        'article:published_time': commodity.publishedAt.toISOString(),
        'article:modified_time': commodity.updatedAt.toISOString(),
        'article:author': `${SITE}/authors/market-desk`,
        'article:section': 'Commodities',
        'article:tag': tags.join(','),
      },
    }
  }

  const currency = await prisma.currencyEvent.findUnique({
    where: { slug },
    select: { metaTitle: true, metaDesc: true, slug: true, pair: true, eventType: true, keywords: true, publishedAt: true, updatedAt: true },
  })
  if (currency) {
    const ogImage = `${SITE}/api/og?title=${encodeURIComponent(currency.metaTitle)}&symbol=${encodeURIComponent(currency.pair)}&type=${currency.eventType}`
    const tags = [currency.pair.replace('_', '/'), 'Currency', 'Forex', 'Rupee', `${currency.pair.replace('_', '/')} rate`]
    return {
      title: currency.metaTitle,
      description: currency.metaDesc,
      alternates: { canonical: `/commodities/${currency.slug}` },
      keywords: [...(currency.keywords || []), ...tags],
      authors: [{ name: 'Market Data Desk', url: `${SITE}/authors/market-desk` }],
      openGraph: {
        title: currency.metaTitle, description: currency.metaDesc, type: 'article',
        url: `${SITE}/commodities/${currency.slug}`, siteName: 'NiftyPulse360', locale: 'en_IN',
        publishedTime: currency.publishedAt.toISOString(), modifiedTime: currency.updatedAt.toISOString(),
        authors: [`${SITE}/authors/market-desk`], section: 'Currency', tags,
        images: [{ url: ogImage, width: 1200, height: 630, alt: currency.metaTitle }],
      },
      twitter: { card: 'summary_large_image', title: currency.metaTitle, description: currency.metaDesc, images: [ogImage], creator: '@niftypulse360' },
      other: {
        'news_keywords': tags.join(', '),
        'article:published_time': currency.publishedAt.toISOString(),
        'article:modified_time': currency.updatedAt.toISOString(),
        'article:author': `${SITE}/authors/market-desk`,
        'article:section': 'Currency',
        'article:tag': tags.join(','),
      },
    }
  }

  return { title: 'Not Found' }
}

function ByLine({ publishedAt, updatedAt, sourceLabel }: { publishedAt: Date; updatedAt: Date; sourceLabel: string }) {
  return (
    <>
      <div className="text-xs text-[#666] mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link href="/authors/market-desk" className="font-semibold text-[#1565C0] hover:underline">By Market Data Desk</Link>
        <span aria-hidden>•</span>
        <span>Published {format(publishedAt, 'dd MMM yyyy, h:mm a')} IST</span>
        {updatedAt.getTime() !== publishedAt.getTime() && (
          <>
            <span aria-hidden>•</span>
            <span>Updated {format(updatedAt, 'dd MMM yyyy, h:mm a')} IST</span>
          </>
        )}
      </div>
      <div className="bg-[#F5F7FA] border border-[#E0E0E0] rounded-md px-3 py-2 mb-4 text-xs text-[#444] flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-center gap-1 font-semibold text-[#1565C0]">🤖 Auto-generated, reviewed by Markets Desk</span>
        <span aria-hidden>•</span>
        <span>Price data: {sourceLabel}</span>
        <Link href="/methodology" className="text-[#1565C0] hover:underline ml-auto">How we make these →</Link>
      </div>
    </>
  )
}

export default async function CommodityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const commodity = await prisma.commodityEvent.findUnique({ where: { slug } })
  if (commodity) {
    const pageUrl = `${SITE}/commodities/${commodity.slug}`
    const ogImage = `${SITE}/api/og?title=${encodeURIComponent(commodity.metaTitle)}&symbol=${encodeURIComponent(commodity.commodity)}&type=${commodity.eventType}`
    const label = commodity.commodity.replace('_', ' ')

    return (
      <article className="max-w-7xl mx-auto px-4 py-4">
        <StructuredData
          headline={commodity.metaTitle}
          datePublished={commodity.publishedAt.toISOString()}
          dateModified={commodity.updatedAt.toISOString()}
          description={commodity.metaDesc}
          url={pageUrl}
          image={ogImage}
          articleSection="Commodities"
          keywords={[...(commodity.keywords || []), label, 'Commodities']}
          about={{ type: 'Thing', name: label }}
        />
        <BreadcrumbSchema items={[
          { name: 'Home', url: `${SITE}/` },
          { name: 'Commodities', url: `${SITE}/commodities` },
          { name: label, url: pageUrl },
        ]} />
        <BreadCrumb items={[{ label: 'Commodities', href: '/commodities' }, { label }]} />
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{commodity.metaTitle}</h1>
        <ByLine publishedAt={commodity.publishedAt} updatedAt={commodity.updatedAt} sourceLabel="Yahoo Finance / MCX" />
        <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER || ''} />
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: commodity.pageContent }} />
        <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE || ''} />
      </article>
    )
  }

  const currency = await prisma.currencyEvent.findUnique({ where: { slug } })
  if (currency) {
    const pageUrl = `${SITE}/commodities/${currency.slug}`
    const ogImage = `${SITE}/api/og?title=${encodeURIComponent(currency.metaTitle)}&symbol=${encodeURIComponent(currency.pair)}&type=${currency.eventType}`
    const label = currency.pair.replace('_', '/')

    return (
      <article className="max-w-7xl mx-auto px-4 py-4">
        <StructuredData
          headline={currency.metaTitle}
          datePublished={currency.publishedAt.toISOString()}
          dateModified={currency.updatedAt.toISOString()}
          description={currency.metaDesc}
          url={pageUrl}
          image={ogImage}
          articleSection="Currency"
          keywords={[...(currency.keywords || []), label, 'Currency', 'Forex']}
          about={{ type: 'Thing', name: label }}
        />
        <BreadcrumbSchema items={[
          { name: 'Home', url: `${SITE}/` },
          { name: 'Commodities', url: `${SITE}/commodities` },
          { name: label, url: pageUrl },
        ]} />
        <BreadCrumb items={[{ label: 'Commodities', href: '/commodities' }, { label }]} />
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{currency.metaTitle}</h1>
        <ByLine publishedAt={currency.publishedAt} updatedAt={currency.updatedAt} sourceLabel="ExchangeRate API / RBI" />
        <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER || ''} />
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: currency.pageContent }} />
        <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE || ''} />
      </article>
    )
  }

  notFound()
}
