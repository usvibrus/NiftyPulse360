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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const event = await prisma.indexEvent.findUnique({
    where: { slug },
    select: { metaTitle: true, metaDesc: true, slug: true, indexName: true, eventType: true, keywords: true, publishedAt: true, updatedAt: true },
  })
  if (!event) return { title: 'Not Found' }

  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'
  const ogImage = `${SITE}/api/og?title=${encodeURIComponent(event.metaTitle)}&symbol=${encodeURIComponent(event.indexName)}&type=${event.eventType}`
  const tags = [event.indexName, 'NSE', 'Indices', `${event.indexName} today`, `why ${event.indexName} ${event.eventType === 'RISE' ? 'rose' : 'fell'}`]

  return {
    title: event.metaTitle,
    description: event.metaDesc,
    alternates: { canonical: `/indices/${event.slug}` },
    keywords: [...(event.keywords || []), ...tags],
    authors: [{ name: 'Market Data Desk', url: `${SITE}/authors/market-desk` }],
    openGraph: {
      title: event.metaTitle, description: event.metaDesc, type: 'article',
      url: `${SITE}/indices/${event.slug}`, siteName: 'NiftyPulse360', locale: 'en_IN',
      publishedTime: event.publishedAt.toISOString(), modifiedTime: event.updatedAt.toISOString(),
      authors: [`${SITE}/authors/market-desk`], section: 'Indices', tags,
      images: [{ url: ogImage, width: 1200, height: 630, alt: event.metaTitle }],
    },
    twitter: { card: 'summary_large_image', title: event.metaTitle, description: event.metaDesc, images: [ogImage], creator: '@niftypulse360' },
    other: {
      'news_keywords': tags.slice(0, 8).join(', '),
      'article:published_time': event.publishedAt.toISOString(),
      'article:modified_time': event.updatedAt.toISOString(),
      'article:author': `${SITE}/authors/market-desk`,
      'article:section': 'Indices',
      'article:tag': tags.join(','),
    },
  }
}

export default async function IndexEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await prisma.indexEvent.findUnique({ where: { slug } })
  if (!event) notFound()

  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'
  const pageUrl = `${SITE}/indices/${event.slug}`
  const ogImage = `${SITE}/api/og?title=${encodeURIComponent(event.metaTitle)}&symbol=${encodeURIComponent(event.indexName)}&type=${event.eventType}`

  return (
    <article className="max-w-7xl mx-auto px-4 py-4">
      <StructuredData
        headline={event.metaTitle}
        datePublished={event.publishedAt.toISOString()}
        dateModified={event.updatedAt.toISOString()}
        description={event.metaDesc}
        url={pageUrl}
        image={ogImage}
        articleSection="Indices"
        keywords={[...(event.keywords || []), event.indexName, 'NSE', 'Indices']}
        about={{ type: 'Thing', name: event.indexName }}
      />
      <BreadcrumbSchema items={[
        { name: 'Home', url: `${SITE}/` },
        { name: 'Indices', url: `${SITE}/indices` },
        { name: event.indexName, url: pageUrl },
      ]} />

      <BreadCrumb items={[{ label: 'Indices', href: '/indices' }, { label: event.indexName }]} />

      <h1 className="text-2xl md:text-3xl font-bold mb-2">
        Why Did {event.indexName} {event.eventType === 'RISE' ? 'Rise' : 'Fall'} {Math.round(event.changePoints)} Points Today?
      </h1>

      <div className="text-xs text-[#666] mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link href="/authors/market-desk" className="font-semibold text-[#1565C0] hover:underline">By Market Data Desk</Link>
        <span aria-hidden>•</span>
        <span>Published {format(event.publishedAt, 'dd MMM yyyy, h:mm a')} IST</span>
        {event.updatedAt.getTime() !== event.publishedAt.getTime() && (
          <>
            <span aria-hidden>•</span>
            <span>Updated {format(event.updatedAt, 'dd MMM yyyy, h:mm a')} IST</span>
          </>
        )}
      </div>

      <div className="bg-[#F5F7FA] border border-[#E0E0E0] rounded-md px-3 py-2 mb-4 text-xs text-[#444] flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-center gap-1 font-semibold text-[#1565C0]">🤖 Auto-generated, reviewed by Markets Desk</span>
        <span aria-hidden>•</span>
        <span>Price data: NSE Indices Limited</span>
        <span aria-hidden>•</span>
        <span>News: Reuters, PTI, ET, Moneycontrol</span>
        <Link href="/methodology" className="text-[#1565C0] hover:underline ml-auto">How we make these →</Link>
      </div>

      <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER || ''} />
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: event.pageContent }} />
      <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE || ''} />
    </article>
  )
}
