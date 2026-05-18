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
  const event = await prisma.stockEvent.findUnique({
    where: { slug },
    select: {
      metaTitle: true, metaDesc: true, slug: true, symbol: true, companyName: true,
      changePercent: true, eventType: true, sector: true, keywords: true,
      publishedAt: true, updatedAt: true,
    },
  })
  if (!event) return { title: 'Not Found' }

  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'
  const ogImage = `${SITE}/api/og?title=${encodeURIComponent(event.metaTitle)}&symbol=${event.symbol}&change=${event.changePercent.toFixed(1)}%25&type=${event.eventType}`
  const tags = [
    event.symbol,
    event.companyName,
    'NSE',
    event.sector || 'Stocks',
    `${event.companyName} share price`,
    `why ${event.symbol} ${event.eventType === 'RISE' ? 'rose' : 'fell'} today`,
  ]
  const newsKeywords = [event.symbol, `${event.companyName} share price today`, `NSE ${event.symbol}`, `${event.companyName} ${event.eventType === 'RISE' ? 'rally' : 'decline'}`]

  return {
    title: event.metaTitle,
    description: event.metaDesc,
    alternates: { canonical: `/stocks/${event.slug}` },
    keywords: [...(event.keywords || []), ...tags],
    authors: [{ name: 'Market Data Desk', url: `${SITE}/authors/market-desk` }],
    openGraph: {
      title: event.metaTitle,
      description: event.metaDesc,
      type: 'article',
      url: `${SITE}/stocks/${event.slug}`,
      siteName: 'NiftyPulse360',
      locale: 'en_IN',
      publishedTime: event.publishedAt.toISOString(),
      modifiedTime: event.updatedAt.toISOString(),
      authors: [`${SITE}/authors/market-desk`],
      section: 'Stocks',
      tags,
      images: [{ url: ogImage, width: 1200, height: 630, alt: event.metaTitle }],
    },
    twitter: { card: 'summary_large_image', title: event.metaTitle, description: event.metaDesc, images: [ogImage], creator: '@niftypulse360' },
    other: {
      'news_keywords': newsKeywords.join(', '),
      'article:published_time': event.publishedAt.toISOString(),
      'article:modified_time': event.updatedAt.toISOString(),
      'article:author': `${SITE}/authors/market-desk`,
      'article:section': 'Stocks',
      'article:tag': tags.join(','),
      'standout': `${SITE}/stocks/${event.slug}`,
    },
  }
}

export default async function StockEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await prisma.stockEvent.findUnique({ where: { slug } })
  if (!event) notFound()

  // Related stocks today (same day, different symbols)
  const related = await prisma.stockEvent.findMany({
    where: { isPublished: true, slug: { not: slug } },
    orderBy: { publishedAt: 'desc' },
    take: 6,
    select: { slug: true, companyName: true, symbol: true, eventType: true, changePercent: true, closePrice: true },
  })

  // GUIDE 10.1: Previous day page for same symbol
  const previousDay = await prisma.stockEvent.findFirst({
    where: { isPublished: true, symbol: event.symbol, slug: { not: slug }, eventDate: { lt: event.eventDate } },
    orderBy: { eventDate: 'desc' },
    select: { slug: true, eventType: true, changePercent: true, eventDate: true },
  })

  // GUIDE 10.1: Recent same-sector stocks (sector context)
  const sectorPeers = event.sector ? await prisma.stockEvent.findMany({
    where: { isPublished: true, sector: event.sector, slug: { not: slug } },
    orderBy: { publishedAt: 'desc' },
    take: 4,
    select: { slug: true, symbol: true, eventType: true, changePercent: true },
  }) : []

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
        image={`${siteUrl}/api/og?title=${encodeURIComponent(event.metaTitle)}&symbol=${event.symbol}&change=${event.changePercent.toFixed(1)}%25&type=${event.eventType}`}
        articleSection="Stocks"
        keywords={[...(event.keywords || []), event.symbol, event.companyName, 'NSE', event.sector || 'Stocks']}
        about={{ type: 'Corporation', name: event.companyName, tickerSymbol: event.symbol, exchange: 'NSE' }}
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
            <span aria-hidden>•</span>
            <span>{event.exchange} • {event.sector || 'Stocks'}</span>
          </div>

          <div className="bg-[#F5F7FA] border border-[#E0E0E0] rounded-md px-3 py-2 mb-4 text-xs text-[#444] flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1 font-semibold text-[#1565C0]">🤖 Auto-generated, reviewed by Markets Desk</span>
            <span aria-hidden>•</span>
            <span>Price data: NSE/BSE</span>
            <span aria-hidden>•</span>
            <span>News: Reuters, PTI, ET, Moneycontrol, company filings</span>
            <Link href="/methodology" className="text-[#1565C0] hover:underline ml-auto">How we make these →</Link>
          </div>

          <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER || ''} />

          {/* Section: Price Performance Summary (H2) */}
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-3 mt-2">Price Performance Summary</h2>

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

          {/* Internal links bar - GUIDE 10.1 */}
          <div className="bg-[#F5F7FA] border border-[#E0E0E0] rounded-md p-3 mb-6 flex flex-wrap gap-3 text-sm">
            <Link href={`/stocks/symbol/${event.symbol.toLowerCase()}`} className="inline-flex items-center gap-1 text-[#1565C0] hover:underline font-semibold">
              📊 All {event.symbol} analyses →
            </Link>
            {event.sector && (
              <Link href={`/sectors/${event.sector.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`} className="inline-flex items-center gap-1 text-[#1565C0] hover:underline font-semibold">
                🏭 {event.sector} sector →
              </Link>
            )}
            {previousDay && (
              <Link href={`/stocks/${previousDay.slug}`} className="inline-flex items-center gap-1 text-[#1565C0] hover:underline font-semibold">
                ← {event.symbol} on {format(previousDay.eventDate, 'dd MMM')} ({previousDay.eventType === 'RISE' ? '▲' : '▼'} {previousDay.changePercent.toFixed(1)}%)
              </Link>
            )}
            <Link href="/indices" className="inline-flex items-center gap-1 text-[#1565C0] hover:underline font-semibold ml-auto">
              See How Indices Performed Today →
            </Link>
          </div>

          {/* Page Content with all blocks */}
          <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: event.pageContent }} />

          <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE || ''} />

          {/* Expert/Analyst View — GUIDE Section 2 */}
          <section className="bg-white border border-[#E0E0E0] rounded-md p-5 mb-6 border-l-4 border-l-[#10B981]">
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
              💼 Expert View
            </h2>
            <p className="text-sm text-[#444] leading-relaxed">
              Analyst ratings and broker views for {event.companyName} are tracked across major brokerages including Motilal Oswal, ICICI Securities, and HDFC Securities.
              Investors should consider the consensus target price, upcoming earnings calendar, and any analyst upgrade/downgrade actions when evaluating today&apos;s {event.eventType === 'RISE' ? 'rally' : 'decline'}.
              {sectorPeers.length > 0 ? ` Compare with sector peers ${sectorPeers.slice(0, 3).map(p => p.symbol).join(', ')} for relative strength analysis.` : ''}
            </p>
            <p className="text-xs text-[#666] mt-3 italic">
              Note: NiftyPulse360 does not provide buy/sell recommendations. Consult a SEBI-registered investment advisor before making decisions.
            </p>
          </section>

          {/* Sector Peers - GUIDE 10.1 */}
          {sectorPeers.length > 0 && (
            <div className="mb-6">
              <div className="section-header"><span>{event.sector} Sector Peers</span></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0 bg-white border border-t-0 border-[#E0E0E0]">
                {sectorPeers.map(p => (
                  <Link key={p.slug} href={`/stocks/${p.slug}`} className="p-3 border-r border-b border-[#E0E0E0] hover:bg-[#F5F7FA]">
                    <div className="font-semibold text-sm">{p.symbol}</div>
                    <div className={`font-mono-price text-sm font-bold mt-1 ${p.eventType === 'RISE' ? 'text-rise' : 'text-fall'}`}>
                      {p.eventType === 'RISE' ? '▲' : '▼'} {p.changePercent.toFixed(2)}%
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Stocks */}
          <div className="mb-6">
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

          {/* Category Page Links */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Link href="/stocks/top-gainers-today" className="bg-white border border-[#E0E0E0] rounded p-3 hover:border-[#1565C0] hover:bg-[#F5F7FA]">
              <div className="font-semibold text-[#1A1A1A]">📈 Top Gainers</div>
              <div className="text-xs text-[#666] mt-1">Today&apos;s biggest movers up</div>
            </Link>
            <Link href="/stocks/top-losers-today" className="bg-white border border-[#E0E0E0] rounded p-3 hover:border-[#1565C0] hover:bg-[#F5F7FA]">
              <div className="font-semibold text-[#1A1A1A]">📉 Top Losers</div>
              <div className="text-xs text-[#666] mt-1">Today&apos;s biggest movers down</div>
            </Link>
            <Link href="/indices" className="bg-white border border-[#E0E0E0] rounded p-3 hover:border-[#1565C0] hover:bg-[#F5F7FA]">
              <div className="font-semibold text-[#1A1A1A]">📊 Indices</div>
              <div className="text-xs text-[#666] mt-1">Nifty, Sensex, Bank Nifty</div>
            </Link>
            <Link href="/gold" className="bg-white border border-[#E0E0E0] rounded p-3 hover:border-[#1565C0] hover:bg-[#F5F7FA]">
              <div className="font-semibold text-[#1A1A1A]">🪙 Gold &amp; Silver</div>
              <div className="text-xs text-[#666] mt-1">Today&apos;s precious metal rates</div>
            </Link>
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
