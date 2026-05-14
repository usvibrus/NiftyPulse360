import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import BreadCrumb from '@/components/ui/BreadCrumb'
import StructuredData from '@/components/seo/StructuredData'
import AdUnit from '@/components/ui/AdUnit'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const event = await prisma.stockEvent.findUnique({ where: { slug }, select: { metaTitle: true, metaDesc: true, slug: true } })
  if (!event) return { title: 'Not Found' }
  return {
    title: event.metaTitle,
    description: event.metaDesc,
    alternates: { canonical: `/stocks/${event.slug}` },
    openGraph: { title: event.metaTitle, description: event.metaDesc, type: 'article' },
  }
}

export async function generateStaticParams() {
  try {
    const events = await prisma.stockEvent.findMany({ where: { isPublished: true }, select: { slug: true }, take: 100 })
    return events.map(e => ({ slug: e.slug }))
  } catch {
    return []
  }
}

export default async function StockEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await prisma.stockEvent.findUnique({ where: { slug } })
  if (!event) notFound()

  return (
    <article>
      <StructuredData
        headline={event.metaTitle}
        datePublished={event.publishedAt.toISOString()}
        dateModified={event.updatedAt.toISOString()}
        description={event.metaDesc}
        url={`${process.env.NEXT_PUBLIC_SITE_URL}/stocks/${event.slug}`}
      />
      <BreadCrumb items={[{ label: 'Stocks', href: '/stocks' }, { label: `${event.companyName}` }]} />
      <h1 className="text-2xl md:text-3xl font-bold mb-4">
        Why Did {event.companyName} ({event.symbol}) Share Price {event.eventType === 'RISE' ? 'Rise' : 'Fall'} {event.changePercent.toFixed(1)}% Today?
      </h1>
      <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER || ''} />
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: event.pageContent }} />
      <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE || ''} />
    </article>
  )
}
