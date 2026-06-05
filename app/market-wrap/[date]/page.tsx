import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params
  const wrap = await prisma.marketWrap.findUnique({
    where: { slug: `market-wrap-${date}` },
    select: { metaTitle: true, metaDesc: true, wrapDate: true },
  })
  if (!wrap) return { title: 'Market Wrap Not Found' }

  return {
    title: wrap.metaTitle,
    description: wrap.metaDesc,
    alternates: { canonical: `/market-wrap/${date}` },
    openGraph: {
      title: wrap.metaTitle,
      description: wrap.metaDesc,
      url: `${SITE}/market-wrap/${date}`,
      type: 'article',
      publishedTime: wrap.wrapDate.toISOString(),
    },
  }
}

export default async function MarketWrapDetailPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const wrap = await prisma.marketWrap.findUnique({ where: { slug: `market-wrap-${date}` } })
  if (!wrap) notFound()

  const topGainers = (wrap.topGainers as { symbol: string; companyName: string; changePercent: number; closePrice: number }[]) || []
  const topLosers = (wrap.topLosers as { symbol: string; companyName: string; changePercent: number; closePrice: number }[]) || []
  const sectorSummary = (wrap.sectorSummary as { sector: string; count: number; avgChange: number }[]) || []

  return (
    <article className="max-w-4xl mx-auto px-4 py-6">
      <nav className="flex items-center gap-2 text-sm text-[#666] mb-4">
        <Link href="/" className="hover:text-[#1565C0]">Home</Link>
        <span className="text-[#ccc]">/</span>
        <Link href="/market-wrap" className="hover:text-[#1565C0]">Market Wrap</Link>
        <span className="text-[#ccc]">/</span>
        <span className="text-[#1A1A1A] font-medium">{format(wrap.wrapDate, 'dd MMM yyyy')}</span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-2">{wrap.metaTitle}</h1>
      <p className="text-sm text-[#666] mb-6">{format(wrap.wrapDate, 'EEEE, dd MMMM yyyy')}</p>

      {/* Index Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {wrap.niftyClose && (
          <div className="bg-white border border-[#E0E0E0] rounded p-4">
            <div className="text-xs text-[#666]">Nifty 50</div>
            <div className="text-xl font-bold font-mono-price">{wrap.niftyClose.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <div className={`text-sm font-bold ${(wrap.niftyChangePct || 0) >= 0 ? 'text-rise' : 'text-fall'}`}>
              {(wrap.niftyChangePct || 0) >= 0 ? '▲' : '▼'} {wrap.niftyChange?.toFixed(0)} pts ({(wrap.niftyChangePct || 0) >= 0 ? '+' : ''}{wrap.niftyChangePct?.toFixed(2)}%)
            </div>
          </div>
        )}
        {wrap.sensexClose && (
          <div className="bg-white border border-[#E0E0E0] rounded p-4">
            <div className="text-xs text-[#666]">Sensex</div>
            <div className="text-xl font-bold font-mono-price">{wrap.sensexClose.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <div className={`text-sm font-bold ${(wrap.sensexChangePct || 0) >= 0 ? 'text-rise' : 'text-fall'}`}>
              {(wrap.sensexChangePct || 0) >= 0 ? '▲' : '▼'} {wrap.sensexChange?.toFixed(0)} pts ({(wrap.sensexChangePct || 0) >= 0 ? '+' : ''}{wrap.sensexChangePct?.toFixed(2)}%)
            </div>
          </div>
        )}
        {wrap.bankNiftyClose && (
          <div className="bg-white border border-[#E0E0E0] rounded p-4">
            <div className="text-xs text-[#666]">Bank Nifty</div>
            <div className="text-xl font-bold font-mono-price">{wrap.bankNiftyClose.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <div className="text-sm font-bold text-[#666]">{(wrap.bankNiftyChange || 0) >= 0 ? '+' : ''}{wrap.bankNiftyChange?.toFixed(0)} pts</div>
          </div>
        )}
      </div>

      {/* AI Summary */}
      {wrap.aiSummary && (
        <div className="bg-[#F0F7FF] border border-[#1565C0]/20 rounded p-4 mb-6">
          <h2 className="font-bold text-[#1A1A1A] mb-2">Today&apos;s Market Summary</h2>
          <p className="text-sm text-[#333] leading-relaxed">{wrap.aiSummary}</p>
        </div>
      )}

      {/* Top Gainers */}
      {topGainers.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-[#1A1A1A] mb-3">Top Gainers</h2>
          <div className="bg-white border border-[#E0E0E0] rounded">
            {topGainers.map((s, i) => (
              <div key={i} className="flex justify-between items-center p-3 border-b border-[#E0E0E0] last:border-b-0">
                <div>
                  <span className="font-semibold text-sm">{s.companyName}</span>
                  <span className="text-xs text-[#666] ml-2">{s.symbol}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono-price text-sm">₹{s.closePrice.toFixed(2)}</span>
                  <span className="text-rise font-bold text-sm ml-2">+{s.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Losers */}
      {topLosers.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-[#1A1A1A] mb-3">Top Losers</h2>
          <div className="bg-white border border-[#E0E0E0] rounded">
            {topLosers.map((s, i) => (
              <div key={i} className="flex justify-between items-center p-3 border-b border-[#E0E0E0] last:border-b-0">
                <div>
                  <span className="font-semibold text-sm">{s.companyName}</span>
                  <span className="text-xs text-[#666] ml-2">{s.symbol}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono-price text-sm">₹{s.closePrice.toFixed(2)}</span>
                  <span className="text-fall font-bold text-sm ml-2">{s.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sector Summary */}
      {sectorSummary.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-[#1A1A1A] mb-3">Sector Performance</h2>
          <div className="bg-white border border-[#E0E0E0] rounded">
            {sectorSummary.map((s, i) => (
              <div key={i} className="flex justify-between items-center p-3 border-b border-[#E0E0E0] last:border-b-0">
                <span className="font-semibold text-sm">{s.sector}</span>
                <span className={`font-bold text-sm ${s.avgChange >= 0 ? 'text-rise' : 'text-fall'}`}>
                  {s.avgChange >= 0 ? '+' : ''}{s.avgChange.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated content */}
      {wrap.pageContent && <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: wrap.pageContent }} />}

      <div className="mt-8">
        <Link href="/market-wrap" className="text-sm font-semibold text-[#1565C0] hover:text-[#0D47A1]">← All Market Wraps</Link>
      </div>
    </article>
  )
}
