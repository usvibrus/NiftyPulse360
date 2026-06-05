import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema'
import StockTimeline from '@/components/ui/StockTimeline'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  const { symbol } = await params
  const sym = symbol.toUpperCase()
  const latest = await prisma.stockEvent.findFirst({
    where: { symbol: sym, isPublished: true },
    orderBy: { publishedAt: 'desc' },
    select: { companyName: true },
  })
  if (!latest) return { title: 'Not Found' }

  return {
    title: `${latest.companyName} (${sym}) Share Price News & Daily Analysis`,
    description: `All recent news, daily explanations, and significant moves for ${latest.companyName} (NSE: ${sym}). Updated after every trading session.`,
    alternates: { canonical: `/stocks/symbol/${sym.toLowerCase()}` },
    openGraph: {
      title: `${latest.companyName} (${sym}) — NiftyPulse360`,
      description: `Recent news and analysis for ${latest.companyName}.`,
      type: 'website',
      url: `${SITE}/stocks/symbol/${sym.toLowerCase()}`,
      siteName: 'NiftyPulse360',
      locale: 'en_IN',
    },
  }
}

export default async function StockSymbolHub({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()

  const events = await prisma.stockEvent.findMany({
    where: { symbol: sym, isPublished: true },
    orderBy: { eventDate: 'desc' },
    take: 100,
    select: {
      slug: true, metaTitle: true, eventType: true, changePercent: true,
      closePrice: true, eventDate: true, publishedAt: true, companyName: true, sector: true,
    },
  })

  if (events.length === 0) notFound()

  const latest = events[0]
  const sector = latest.sector || ''
  const sectorSlug = sector.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <BreadcrumbSchema items={[
        { name: 'Home', url: `${SITE}/` },
        { name: 'Stocks', url: `${SITE}/stocks` },
        { name: latest.companyName, url: `${SITE}/stocks/symbol/${sym.toLowerCase()}` },
      ]} />

      <nav className="text-xs text-[#666] mb-3" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#1565C0]">Home</Link> › <Link href="/stocks" className="hover:text-[#1565C0]">Stocks</Link> › <span className="text-[#1A1A1A]">{latest.companyName}</span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-bold mb-2">{latest.companyName} ({sym}) — News & Analysis</h1>
      <p className="text-sm text-[#666] mb-1">
        NSE: <span className="font-semibold">{sym}</span>
        {sector && <> · Sector: <Link href={`/sectors/${sectorSlug}`} className="text-[#1565C0] hover:underline">{sector}</Link></>}
      </p>
      <p className="text-sm text-[#666] mb-6">All published explanations for significant moves of {latest.companyName} stock. Updated after every NSE trading session.</p>

      {/* Stock Timeline */}
      <StockTimeline
        symbol={sym}
        events={events.map(e => ({
          eventDate: format(e.eventDate, 'dd MMM'),
          eventType: e.eventType,
          changePercent: e.changePercent,
        }))}
      />

      <section>
        <div className="section-header"><span>📚 All Recent Analyses ({events.length})</span></div>
        <div className="bg-white border border-t-0 border-[#E0E0E0]">
          {events.map(e => (
            <Link key={e.slug} href={`/stocks/${e.slug}`} className="block p-3 border-b border-[#E0E0E0] last:border-b-0 hover:bg-[#F5F7FA]">
              <div className="text-sm font-semibold text-[#1A1A1A] hover:text-[#1565C0] line-clamp-2">{e.metaTitle}</div>
              <div className="text-xs text-[#666] mt-1 flex flex-wrap items-center gap-x-2">
                <span>{format(e.eventDate, 'dd MMM yyyy')}</span>
                <span aria-hidden>•</span>
                <span className={e.eventType === 'RISE' ? 'text-rise font-semibold' : 'text-fall font-semibold'}>
                  {e.eventType === 'RISE' ? '▲' : '▼'} {e.changePercent.toFixed(2)}%
                </span>
                <span aria-hidden>•</span>
                <span>₹{e.closePrice.toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
