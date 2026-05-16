import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'
import StructuredData from '@/components/seo/StructuredData'
import FAQSchema from '@/components/seo/FAQSchema'
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema'
import AdUnit from '@/components/ui/AdUnit'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const event = await prisma.stockEvent.findUnique({ where: { slug }, select: { metaTitle: true, metaDesc: true, slug: true, symbol: true, changePercent: true, eventType: true } })
  if (!event) return { title: 'Not Found' }
  const ogImage = `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${encodeURIComponent(event.metaTitle)}&symbol=${event.symbol}&change=${event.changePercent.toFixed(1)}%25&type=${event.eventType}`
  return {
    title: event.metaTitle,
    description: event.metaDesc,
    alternates: { canonical: `/stocks/${event.slug}` },
    openGraph: { title: event.metaTitle, description: event.metaDesc, type: 'article', images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', images: [ogImage] },
  }
}

export default async function StockEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await prisma.stockEvent.findUnique({ where: { slug } })
  if (!event) notFound()

  const related = await prisma.stockEvent.findMany({
    where: { isPublished: true, slug: { not: slug } },
    orderBy: { publishedAt: 'desc' },
    take: 6,
    select: { slug: true, companyName: true, symbol: true, eventType: true, changePercent: true, closePrice: true },
  })

  const newsItems = (event.newsItems as { title: string; url: string; source: string; publishedAt: string; snippet?: string }[]) || []
  const faqItems = (event.faqContent as { question: string; answer: string }[]) || []
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'
  const pageUrl = `${siteUrl}/stocks/${event.slug}`

  const breadcrumbItems = [
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Stocks', url: `${siteUrl}/stocks` },
    { name: event.companyName, url: pageUrl },
  ]

  const volRatio = event.avgVolume && Number(event.avgVolume) > 0
    ? (Number(event.volume) / Number(event.avgVolume)).toFixed(1)
    : null

  const week52Pos = event.week52High && event.week52Low && event.week52High > event.week52Low
    ? ((event.closePrice - event.week52Low) / (event.week52High - event.week52Low) * 100).toFixed(0)
    : null

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Schema markup */}
      <StructuredData
        headline={event.metaTitle}
        datePublished={event.publishedAt.toISOString()}
        dateModified={event.updatedAt.toISOString()}
        description={event.metaDesc}
        url={pageUrl}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      {faqItems.length > 0 && <FAQSchema items={faqItems} />}

      {/* Breadcrumb */}
      <nav className="text-xs text-[#666] mb-3" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#1565C0]">Home</Link> › <Link href="/stocks" className="hover:text-[#1565C0]">Stocks</Link> › <span className="text-[#1A1A1A]">{event.companyName}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Content */}
        <article className="lg:w-[70%]">
          {/* H1 */}
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] leading-tight mb-2">
            Why Did {event.companyName} ({event.symbol}) Share Price {event.eventType === 'RISE' ? 'Rise' : 'Fall'} {event.changePercent.toFixed(2)}% Today?
          </h1>
          <div className="text-xs text-[#666] mb-4">
            {format(event.publishedAt, 'dd MMM yyyy, h:mm a')} IST • {event.exchange} • {event.sector || 'Stocks'}
          </div>

          <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER || ''} />

          {/* Price Summary Box */}
          <div className="price-box mb-6">
            <div className="price-box-header flex justify-between items-center flex-wrap gap-4">
              <div>
                <div className="font-bold text-lg">{event.companyName}</div>
                <div className="text-xs text-[#666]">{event.symbol} • {event.exchange} • {event.sector}</div>
              </div>
              <div className="text-right">
                <div className="font-mono-price text-2xl font-bold">₹{event.closePrice.toFixed(2)}</div>
                <div className={`font-mono-price text-sm font-bold ${event.eventType === 'RISE' ? 'text-rise' : 'text-fall'}`}>
                  {event.eventType === 'RISE' ? '▲' : '▼'} {event.changeAmount.toFixed(2)} ({event.eventType === 'RISE' ? '+' : '-'}{event.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
            <div className="price-box-grid">
              <div><div className="text-xs text-[#666]">Open</div><div className="font-mono-price font-bold">₹{event.openPrice.toFixed(2)}</div></div>
              <div><div className="text-xs text-[#666]">High</div><div className="font-mono-price font-bold">₹{event.highPrice.toFixed(2)}</div></div>
              <div><div className="text-xs text-[#666]">Low</div><div className="font-mono-price font-bold">₹{event.lowPrice.toFixed(2)}</div></div>
              <div><div className="text-xs text-[#666]">Prev Close</div><div className="font-mono-price font-bold">₹{(event.closePrice - event.changeAmount * (event.eventType === 'RISE' ? 1 : -1)).toFixed(2)}</div></div>
            </div>
            <div className="p-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span><span className="text-[#666]">Volume:</span> <span className="font-bold">{(Number(event.volume) / 100000).toFixed(2)}L</span></span>
              {volRatio && <span><span className="text-[#666]">vs Avg:</span> <span className="font-bold">{volRatio}x</span></span>}
              {event.week52High && <span><span className="text-[#666]">52W High:</span> <span className="font-bold">₹{event.week52High.toFixed(0)}</span></span>}
              {event.week52Low && <span><span className="text-[#666]">52W Low:</span> <span className="font-bold">₹{event.week52Low.toFixed(0)}</span></span>}
              {week52Pos && <span><span className="text-[#666]">52W Range:</span> <span className="font-bold">{week52Pos}%</span></span>}
            </div>
          </div>

          {/* Page Content with all blocks */}
          <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: event.pageContent }} />

          <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE || ''} />

          {/* Related Stocks */}
          <div className="mb-6 mt-6">
            <div className="section-header"><span>More Stocks That Moved Today</span></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-0 bg-white border border-t-0 border-[#E0E0E0]">
              {related.map(r => (
                <Link key={r.slug} href={`/stocks/${r.slug}`} className="p-4 border-r border-b border-[#E0E0E0] hover:bg-[#F5F7FA]">
                  <div className="font-semibold text-sm">{r.symbol}</div>
                  <div className="text-xs text-[#666] line-clamp-1">{r.companyName}</div>
                  <div className={`font-mono-price text-sm font-bold mt-1 ${r.eventType === 'RISE' ? 'text-rise' : 'text-fall'}`}>
                    {r.eventType === 'RISE' ? '▲' : '▼'} {r.changePercent.toFixed(2)}%
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER || ''} />
        </article>

        {/* Right Sidebar */}
        <aside className="lg:w-[30%]">
          <div className="sticky top-[120px]">
            {/* Market Snapshot */}
            <div className="mb-4">
              <div className="section-header"><span>Today&apos;s Movers</span></div>
              <div className="bg-white border border-t-0 border-[#E0E0E0]">
                {related.slice(0, 5).map(r => (
                  <Link key={r.slug} href={`/stocks/${r.slug}`} className="flex justify-between items-center p-3 border-b border-[#E0E0E0] last:border-b-0 hover:bg-[#F5F7FA]">
                    <span className="text-sm font-semibold">{r.symbol}</span>
                    <div className="text-right">
                      <span className="font-mono-price text-sm">₹{r.closePrice.toFixed(0)}</span>
                      <span className={`ml-2 text-xs font-bold ${r.eventType === 'RISE' ? 'text-rise' : 'text-fall'}`}>
                        {r.eventType === 'RISE' ? '▲' : '▼'}{r.changePercent.toFixed(1)}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || ''} />

            {/* Stock Info Card */}
            <div className="mt-4 bg-white border border-[#E0E0E0] rounded p-4">
              <h3 className="font-bold text-sm mb-2">About {event.companyName}</h3>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-[#E0E0E0]"><td className="py-2 text-[#666]">Symbol</td><td className="py-2 font-bold text-right">{event.symbol}</td></tr>
                  <tr className="border-b border-[#E0E0E0]"><td className="py-2 text-[#666]">Exchange</td><td className="py-2 font-bold text-right">{event.exchange}</td></tr>
                  <tr className="border-b border-[#E0E0E0]"><td className="py-2 text-[#666]">Sector</td><td className="py-2 font-bold text-right">{event.sector || '-'}</td></tr>
                  {event.week52High && <tr className="border-b border-[#E0E0E0]"><td className="py-2 text-[#666]">52W High</td><td className="py-2 font-bold text-right">₹{event.week52High.toFixed(2)}</td></tr>}
                  {event.week52Low && <tr className="border-b border-[#E0E0E0]"><td className="py-2 text-[#666]">52W Low</td><td className="py-2 font-bold text-right">₹{event.week52Low.toFixed(2)}</td></tr>}
                  <tr><td className="py-2 text-[#666]">Event Date</td><td className="py-2 font-bold text-right">{format(event.eventDate, 'dd MMM yyyy')}</td></tr>
                </tbody>
              </table>
            </div>

            {newsItems.length > 0 && (
              <div className="mt-4 bg-white border border-[#E0E0E0] rounded">
                <div className="section-header"><span>Top Headlines</span></div>
                <div className="p-3">
                  {newsItems.slice(0, 3).map((n, i) => (
                    <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" className="block py-2 border-b border-[#E0E0E0] last:border-b-0 hover:bg-[#F5F7FA] -mx-3 px-3">
                      <div className="text-xs font-semibold text-[#1A1A1A] line-clamp-2 hover:text-[#1565C0]">{n.title}</div>
                      <div className="text-[10px] text-[#666] mt-1">{n.source} • {n.publishedAt}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
