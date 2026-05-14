import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import BreadCrumb from '@/components/ui/BreadCrumb'
import StructuredData from '@/components/seo/StructuredData'
import AdUnit from '@/components/ui/AdUnit'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const commodity = await prisma.commodityEvent.findUnique({ where: { slug }, select: { metaTitle: true, metaDesc: true, slug: true } })
  if (commodity) return { title: commodity.metaTitle, description: commodity.metaDesc, alternates: { canonical: `/commodities/${commodity.slug}` } }

  const currency = await prisma.currencyEvent.findUnique({ where: { slug }, select: { metaTitle: true, metaDesc: true, slug: true } })
  if (currency) return { title: currency.metaTitle, description: currency.metaDesc, alternates: { canonical: `/commodities/${currency.slug}` } }

  return { title: 'Not Found' }
}

export async function generateStaticParams() {
  try {
    const [commodities, currencies] = await Promise.all([
      prisma.commodityEvent.findMany({ where: { isPublished: true }, select: { slug: true }, take: 100 }),
      prisma.currencyEvent.findMany({ where: { isPublished: true }, select: { slug: true }, take: 100 }),
    ])
    return [...commodities, ...currencies].map(e => ({ slug: e.slug }))
  } catch {
    return []
  }
}

export default async function CommodityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const commodity = await prisma.commodityEvent.findUnique({ where: { slug } })
  if (commodity) {
    return (
      <article>
        <StructuredData headline={commodity.metaTitle} datePublished={commodity.publishedAt.toISOString()} dateModified={commodity.updatedAt.toISOString()} description={commodity.metaDesc} url={`${process.env.NEXT_PUBLIC_SITE_URL}/commodities/${commodity.slug}`} />
        <BreadCrumb items={[{ label: 'Commodities', href: '/commodities' }, { label: commodity.commodity.replace('_', ' ') }]} />
        <h1 className="text-2xl md:text-3xl font-bold mb-4">{commodity.metaTitle}</h1>
        <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER || ''} />
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: commodity.pageContent }} />
        <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE || ''} />
      </article>
    )
  }

  const currency = await prisma.currencyEvent.findUnique({ where: { slug } })
  if (currency) {
    return (
      <article>
        <StructuredData headline={currency.metaTitle} datePublished={currency.publishedAt.toISOString()} dateModified={currency.updatedAt.toISOString()} description={currency.metaDesc} url={`${process.env.NEXT_PUBLIC_SITE_URL}/commodities/${currency.slug}`} />
        <BreadCrumb items={[{ label: 'Commodities', href: '/commodities' }, { label: currency.pair.replace('_', '/') }]} />
        <h1 className="text-2xl md:text-3xl font-bold mb-4">{currency.metaTitle}</h1>
        <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER || ''} />
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: currency.pageContent }} />
        <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE || ''} />
      </article>
    )
  }

  notFound()
}
