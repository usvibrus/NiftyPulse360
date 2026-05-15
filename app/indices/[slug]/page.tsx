import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import BreadCrumb from '@/components/ui/BreadCrumb'
import StructuredData from '@/components/seo/StructuredData'
import AdUnit from '@/components/ui/AdUnit'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const event = await prisma.indexEvent.findUnique({ where: { slug }, select: { metaTitle: true, metaDesc: true, slug: true } })
  if (!event) return { title: 'Not Found' }
  return { title: event.metaTitle, description: event.metaDesc, alternates: { canonical: `/indices/${event.slug}` } }
}

export default async function IndexEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await prisma.indexEvent.findUnique({ where: { slug } })
  if (!event) notFound()

  return (
    <article>
      <StructuredData headline={event.metaTitle} datePublished={event.publishedAt.toISOString()} dateModified={event.updatedAt.toISOString()} description={event.metaDesc} url={`${process.env.NEXT_PUBLIC_SITE_URL}/indices/${event.slug}`} />
      <BreadCrumb items={[{ label: 'Indices', href: '/indices' }, { label: event.indexName }]} />
      <h1 className="text-2xl md:text-3xl font-bold mb-4">
        Why Did {event.indexName} {event.eventType === 'RISE' ? 'Rise' : 'Fall'} {Math.round(event.changePoints)} Points Today?
      </h1>
      <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER || ''} />
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: event.pageContent }} />
      <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE || ''} />
    </article>
  )
}
