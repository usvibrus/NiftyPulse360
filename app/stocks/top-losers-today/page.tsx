import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import { format } from 'date-fns'
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema'
import { startOfDayIST } from '@/lib/utils/dateUtils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Top Losers NSE Today — Worst Performing Stocks | NiftyPulse360',
  description: "Today's top losers on NSE. Live list of worst performing Indian stocks with reasons behind their decline, volume and analysis.",
  alternates: { canonical: '/stocks/top-losers-today' },
}

export default async function TopLosersPage() {
  const todayStart = startOfDayIST(new Date())

  const losers = await prisma.stockEvent.findMany({
    where: { isPublished: true, eventType: 'FALL', eventDate: { gte: todayStart } },
    orderBy: { changePercent: 'desc' },
    take: 50,
    select: { slug: true, companyName: true, symbol: true, changePercent: true, closePrice: true, volume: true, sector: true, eventDate: true },
  })

  const fallbackLosers = losers.length === 0 ? await prisma.stockEvent.findMany({
    where: { isPublished: true, eventType: 'FALL' },
    orderBy: { publishedAt: 'desc' },
    take: 50,
    select: { slug: true, companyName: true, symbol: true, changePercent: true, closePrice: true, volume: true, sector: true, eventDate: true },
  }) : []

  const list = losers.length > 0 ? losers : fallbackLosers
  const isToday = losers.length > 0
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <BreadcrumbSchema items={[
        { name: 'Home', url: `${siteUrl}/` },
        { name: 'Stocks', url: `${siteUrl}/stocks` },
        { name: 'Top Losers Today', url: `${siteUrl}/stocks/top-losers-today` },
      ]} />

      <nav className="text-xs text-[#666] mb-3">
        <Link href="/" className="hover:text-[#1565C0]">Home</Link> › <Link href="/stocks" className="hover:text-[#1565C0]">Stocks</Link> › <span className="text-[#1A1A1A]">Top Losers Today</span>
      </nav>

      <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] mb-2">📉 Top Losers on NSE Today</h1>
      <p className="text-sm text-[#666] mb-4">
        {isToday
          ? `Live list of worst performing Indian stocks on ${format(new Date(), 'dd MMM yyyy')}. Updated after every market close.`
          : `Most recent losers from the last trading session. Markets are currently closed — fresh data will appear after the next session.`}
      </p>

      <div className="bg-white border border-[#E0E0E0] rounded mb-6">
        <div className="section-header"><span>Top Losers — Sorted by % Change</span></div>
        {list.length === 0 ? (
          <p className="p-6 text-center text-[#666]">No loser data available yet. Check back after the next market close.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F7FA] text-xs text-[#666] uppercase">
                <th className="text-left p-2 pl-4 w-10">#</th>
                <th className="text-left p-2">Company</th>
                <th className="text-right p-2 hidden md:table-cell">Sector</th>
                <th className="text-right p-2">Price</th>
                <th className="text-right p-2">Change</th>
                <th className="text-right p-2 pr-4 hidden md:table-cell">Volume</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s, i) => (
                <tr key={s.slug} className="border-t border-[#E0E0E0] hover:bg-[#F5F7FA]">
                  <td className="p-2 pl-4 text-[#666]">{i + 1}</td>
                  <td className="p-2">
                    <Link href={`/stocks/${s.slug}`} className="font-semibold text-[#1A1A1A] hover:text-[#1565C0]">{s.companyName}</Link>
                    <div className="text-xs text-[#666]">{s.symbol}</div>
                  </td>
                  <td className="text-right p-2 text-xs text-[#666] hidden md:table-cell">{s.sector || '-'}</td>
                  <td className="text-right p-2 font-mono-price">₹{s.closePrice.toFixed(2)}</td>
                  <td className="text-right p-2 font-bold text-fall">▼ -{s.changePercent.toFixed(2)}%</td>
                  <td className="text-right p-2 pr-4 text-[#666] hidden md:table-cell">{(Number(s.volume) / 100000).toFixed(1)}L</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-6">
        <Link href="/stocks/top-gainers-today" className="bg-white border border-[#E0E0E0] rounded p-3 hover:border-[#1565C0]">
          <div className="font-semibold text-[#1A1A1A]">📈 Top Gainers</div>
          <div className="text-xs text-[#666] mt-1">Today&apos;s biggest movers up</div>
        </Link>
        <Link href="/stocks" className="bg-white border border-[#E0E0E0] rounded p-3 hover:border-[#1565C0]">
          <div className="font-semibold text-[#1A1A1A]">📊 All Stocks</div>
          <div className="text-xs text-[#666] mt-1">Browse all stock updates</div>
        </Link>
        <Link href="/indices" className="bg-white border border-[#E0E0E0] rounded p-3 hover:border-[#1565C0]">
          <div className="font-semibold text-[#1A1A1A]">📈 Indices</div>
          <div className="text-xs text-[#666] mt-1">Nifty, Sensex updates</div>
        </Link>
        <Link href="/gold" className="bg-white border border-[#E0E0E0] rounded p-3 hover:border-[#1565C0]">
          <div className="font-semibold text-[#1A1A1A]">🪙 Gold &amp; Silver</div>
          <div className="text-xs text-[#666] mt-1">Today&apos;s metal rates</div>
        </Link>
      </div>

      <section className="bg-white border border-[#E0E0E0] rounded p-5 mb-6">
        <h2 className="text-lg font-bold mb-3">About Today&apos;s Top Losers</h2>
        <p className="text-sm text-[#444] mb-3 leading-relaxed">
          Top losers are NSE-listed stocks that have shown the highest percentage decline in their share price during today&apos;s trading session. NiftyPulse360 tracks all NSE stocks that moved more than 1% with significant volume.
        </p>
        <p className="text-sm text-[#444] mb-3 leading-relaxed">
          Click on any stock above to see detailed analysis, including the specific reason behind the decline, volume context, sector comparison, and 52-week range. Each page updates automatically after market close at 3:45 PM IST on trading days.
        </p>
        <p className="text-xs text-[#666] italic">
          Disclaimer: NiftyPulse360 is not a SEBI-registered investment advisor.
        </p>
      </section>
    </div>
  )
}
