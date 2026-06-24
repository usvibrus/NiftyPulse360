// Page optimized
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

export async function generateMetadata(): Promise<Metadata> {
  const latest = await prisma.preMarketData.findFirst({
    where: { isPublished: true },
    orderBy: { dataDate: 'desc' },
    select: { metaTitle: true, metaDesc: true, dataDate: true },
  })

  const title = latest?.metaTitle || 'Pre-Market Today — Gift Nifty, US Markets, Crude Oil | NiftyPulse360'
  const description = latest?.metaDesc || 'Today\'s pre-market indicators: Gift Nifty, US markets (Dow, S&P, Nasdaq), crude oil, gold, and USD/INR. Know what to expect before market opens.'

  return {
    title,
    description,
    keywords: ['pre market today', 'gift nifty today', 'gift nifty live', 'sgx nifty', 'us market today', 'market opening today'],
    alternates: { canonical: '/pre-market-today' },
    openGraph: { title, description, url: `${SITE}/pre-market-today`, type: 'article' },
  }
}

export default async function PreMarketPage() {
  const data = await prisma.preMarketData.findFirst({
    where: { isPublished: true },
    orderBy: { dataDate: 'desc' },
  })

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4">Pre-Market Today</h1>
        <div className="bg-white border border-[#E0E0E0] p-8 text-center">
          <p className="text-[#666]">Pre-market data will be available before market opens (7:30 AM IST).</p>
          <Link href="/" className="inline-block mt-3 text-sm font-semibold text-[#1565C0]">← Back to Home</Link>
        </div>
      </div>
    )
  }

  const dateStr = format(data.dataDate, 'dd MMMM yyyy')

  return (
    <article className="max-w-4xl mx-auto px-4 py-6">
      <nav className="flex items-center gap-2 text-sm text-[#666] mb-4">
        <Link href="/" className="hover:text-[#1565C0]">Home</Link>
        <span className="text-[#ccc]">/</span>
        <span className="text-[#1A1A1A] font-medium">Pre-Market Today</span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-1">Pre-Market Today — {dateStr}</h1>
      <p className="text-sm text-[#666] mb-6">Global indicators before Indian market opens at 9:15 AM IST.</p>

      {/* Gift Nifty */}
      {data.giftNifty && (
        <div className="bg-[#F0F7FF] border border-[#1565C0]/20 rounded p-5 mb-6">
          <div className="text-xs text-[#666] uppercase font-semibold mb-1">Gift Nifty (Nifty Futures)</div>
          <div className="text-3xl font-bold font-mono-price">{data.giftNifty.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          {data.giftNiftyChange !== null && (
            <div className={`text-lg font-bold ${(data.giftNiftyChange || 0) >= 0 ? 'text-rise' : 'text-fall'}`}>
              {(data.giftNiftyChange || 0) >= 0 ? '▲' : '▼'} {Math.abs(data.giftNiftyChange || 0).toFixed(0)} pts
              {data.giftNiftyPct ? ` (${data.giftNiftyPct >= 0 ? '+' : ''}${data.giftNiftyPct.toFixed(2)}%)` : ''}
            </div>
          )}
          <p className="text-xs text-[#666] mt-2">
            {(data.giftNiftyChange || 0) >= 0
              ? 'Positive signal — Indian markets likely to open higher.'
              : 'Negative signal — Indian markets may open lower.'}
          </p>
        </div>
      )}

      {/* US Markets */}
      <div className="mb-6">
        <h2 className="font-bold text-[#1A1A1A] mb-3">US Markets (Previous Close)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.dowJones && (
            <div className="bg-white border border-[#E0E0E0] rounded p-4">
              <div className="text-xs text-[#666]">Dow Jones</div>
              <div className="text-lg font-bold font-mono-price">{data.dowJones.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
              {data.dowChange !== null && (
                <div className={`text-sm font-bold ${(data.dowChange || 0) >= 0 ? 'text-rise' : 'text-fall'}`}>
                  {(data.dowChange || 0) >= 0 ? '+' : ''}{data.dowChange?.toFixed(0)} pts
                </div>
              )}
            </div>
          )}
          {data.sp500 && (
            <div className="bg-white border border-[#E0E0E0] rounded p-4">
              <div className="text-xs text-[#666]">S&amp;P 500</div>
              <div className="text-lg font-bold font-mono-price">{data.sp500.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
              {data.sp500Change !== null && (
                <div className={`text-sm font-bold ${(data.sp500Change || 0) >= 0 ? 'text-rise' : 'text-fall'}`}>
                  {(data.sp500Change || 0) >= 0 ? '+' : ''}{data.sp500Change?.toFixed(0)} pts
                </div>
              )}
            </div>
          )}
          {data.nasdaq && (
            <div className="bg-white border border-[#E0E0E0] rounded p-4">
              <div className="text-xs text-[#666]">Nasdaq</div>
              <div className="text-lg font-bold font-mono-price">{data.nasdaq.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
              {data.nasdaqChange !== null && (
                <div className={`text-sm font-bold ${(data.nasdaqChange || 0) >= 0 ? 'text-rise' : 'text-fall'}`}>
                  {(data.nasdaqChange || 0) >= 0 ? '+' : ''}{data.nasdaqChange?.toFixed(0)} pts
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Commodities & Forex */}
      <div className="mb-6">
        <h2 className="font-bold text-[#1A1A1A] mb-3">Commodities &amp; Forex</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {data.crudeOil && (
            <div className="bg-white border border-[#E0E0E0] rounded p-4">
              <div className="text-xs text-[#666]">Crude Oil (Brent)</div>
              <div className="font-bold font-mono-price">${data.crudeOil.toFixed(2)}</div>
              {data.crudeChange !== null && <div className={`text-xs font-bold ${(data.crudeChange || 0) >= 0 ? 'text-rise' : 'text-fall'}`}>{(data.crudeChange || 0) >= 0 ? '+' : ''}{data.crudeChange?.toFixed(2)}%</div>}
            </div>
          )}
          {data.goldPrice && (
            <div className="bg-white border border-[#E0E0E0] rounded p-4">
              <div className="text-xs text-[#666]">Gold</div>
              <div className="font-bold font-mono-price">₹{data.goldPrice.toFixed(0)}/g</div>
              {data.goldChange !== null && <div className={`text-xs font-bold ${(data.goldChange || 0) >= 0 ? 'text-rise' : 'text-fall'}`}>{(data.goldChange || 0) >= 0 ? '+' : ''}{data.goldChange?.toFixed(2)}%</div>}
            </div>
          )}
          {data.usdInr && (
            <div className="bg-white border border-[#E0E0E0] rounded p-4">
              <div className="text-xs text-[#666]">USD/INR</div>
              <div className="font-bold font-mono-price">₹{data.usdInr.toFixed(2)}</div>
              {data.usdInrChange !== null && <div className={`text-xs font-bold ${(data.usdInrChange || 0) >= 0 ? 'text-rise' : 'text-fall'}`}>{(data.usdInrChange || 0) >= 0 ? '+' : ''}{data.usdInrChange?.toFixed(2)}%</div>}
            </div>
          )}
        </div>
      </div>

      {/* AI Expectation */}
      {data.aiExpectation && (
        <div className="bg-white border border-[#E0E0E0] rounded p-4 mb-6">
          <h2 className="font-bold text-[#1A1A1A] mb-2">What to Expect Today</h2>
          <p className="text-sm text-[#333] leading-relaxed">{data.aiExpectation}</p>
        </div>
      )}

      {data.pageContent && <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: data.pageContent }} />}
    </article>
  )
}
