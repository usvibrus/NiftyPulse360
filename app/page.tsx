import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { format } from 'date-fns'
import LiveTicker from '@/components/ui/LiveTicker'
import LiveSidebar from '@/components/ui/LiveSidebar'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [stocks, indices, metals] = await Promise.all([
    prisma.stockEvent.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' }, take: 15, select: { slug: true, companyName: true, symbol: true, eventType: true, changePercent: true, closePrice: true, volume: true, eventDate: true, publishedAt: true } }),
    prisma.indexEvent.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' }, take: 5, select: { slug: true, indexName: true, eventType: true, changePercent: true, changePoints: true, closeValue: true, eventDate: true } }),
    prisma.metalEvent.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' }, take: 4, select: { slug: true, metal: true, carat: true, eventType: true, changePercent: true, pricePerGram: true, eventDate: true } }),
  ])

  const gainers = stocks.filter(s => s.eventType === 'RISE').slice(0, 8)
  const losers = stocks.filter(s => s.eventType === 'FALL').slice(0, 8)

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Live Market Ticker */}
      <LiveTicker />

      {/* Main Content - 2 column */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Column */}
        <div className="lg:w-[65%]">
          {/* Top Movers Table */}
          <div className="mb-4">
            <div className="section-header">
              <span>📈 Today&apos;s Top Movers</span>
              <Link href="/stocks" className="text-xs font-normal opacity-80 hover:opacity-100">View All →</Link>
            </div>
            <div className="bg-white border border-t-0 border-[#E0E0E0]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F5F7FA] text-xs text-[#666] uppercase">
                    <th className="text-left p-2 pl-4">Company</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-right p-2">Change</th>
                    <th className="text-right p-2 pr-4 hidden md:table-cell">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {gainers.slice(0, 5).map(s => (
                    <tr key={s.slug} className="border-t border-[#E0E0E0] hover:bg-[#F5F7FA]">
                      <td className="p-2 pl-4">
                        <Link href={`/stocks/${s.slug}`} className="font-semibold text-[#1A1A1A] hover:text-[#1565C0]">{s.companyName}</Link>
                        <div className="text-xs text-[#666]">{s.symbol}</div>
                      </td>
                      <td className="text-right p-2 font-mono-price">₹{s.closePrice.toFixed(2)}</td>
                      <td className="text-right p-2 font-bold text-rise">▲ +{s.changePercent.toFixed(2)}%</td>
                      <td className="text-right p-2 pr-4 text-[#666] hidden md:table-cell">{(Number(s.volume) / 100000).toFixed(1)}L</td>
                    </tr>
                  ))}
                  {losers.slice(0, 5).map(s => (
                    <tr key={s.slug} className="border-t border-[#E0E0E0] hover:bg-[#F5F7FA]">
                      <td className="p-2 pl-4">
                        <Link href={`/stocks/${s.slug}`} className="font-semibold text-[#1A1A1A] hover:text-[#1565C0]">{s.companyName}</Link>
                        <div className="text-xs text-[#666]">{s.symbol}</div>
                      </td>
                      <td className="text-right p-2 font-mono-price">₹{s.closePrice.toFixed(2)}</td>
                      <td className="text-right p-2 font-bold text-fall">▼ -{s.changePercent.toFixed(2)}%</td>
                      <td className="text-right p-2 pr-4 text-[#666] hidden md:table-cell">{(Number(s.volume) / 100000).toFixed(1)}L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Trader Tools - Internal links to high-intent SEO pages */}
          <div className="mb-4">
            <div className="section-header">
              <span>🧰 Daily Trader Tools</span>
            </div>
            <div className="bg-white border border-t-0 border-[#E0E0E0] p-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <Link href="/stocks/upper-circuit-stocks-today" className="border border-[#E0E0E0] rounded p-2 hover:border-[#1565C0] hover:bg-[#F5F7FA]">
                  <div className="font-semibold text-[#1A1A1A]">🔥 Upper Circuit</div>
                  <div className="text-xs text-[#666]">Stocks at upper limit</div>
                </Link>
                <Link href="/stocks/lower-circuit-stocks-today" className="border border-[#E0E0E0] rounded p-2 hover:border-[#1565C0] hover:bg-[#F5F7FA]">
                  <div className="font-semibold text-[#1A1A1A]">🧊 Lower Circuit</div>
                  <div className="text-xs text-[#666]">Stocks at lower limit</div>
                </Link>
                <Link href="/stocks/52-week-high-stocks-today" className="border border-[#E0E0E0] rounded p-2 hover:border-[#1565C0] hover:bg-[#F5F7FA]">
                  <div className="font-semibold text-[#1A1A1A]">🎯 52-Week High</div>
                  <div className="text-xs text-[#666]">Fresh yearly highs</div>
                </Link>
                <Link href="/stocks/52-week-low-stocks-today" className="border border-[#E0E0E0] rounded p-2 hover:border-[#1565C0] hover:bg-[#F5F7FA]">
                  <div className="font-semibold text-[#1A1A1A]">📉 52-Week Low</div>
                  <div className="text-xs text-[#666]">Fresh yearly lows</div>
                </Link>
                <Link href="/stocks/top-gainers-today" className="border border-[#E0E0E0] rounded p-2 hover:border-[#1565C0] hover:bg-[#F5F7FA]">
                  <div className="font-semibold text-[#1A1A1A]">📈 Top Gainers</div>
                  <div className="text-xs text-[#666]">Biggest winners</div>
                </Link>
                <Link href="/stocks/top-losers-today" className="border border-[#E0E0E0] rounded p-2 hover:border-[#1565C0] hover:bg-[#F5F7FA]">
                  <div className="font-semibold text-[#1A1A1A]">📊 Top Losers</div>
                  <div className="text-xs text-[#666]">Biggest decliners</div>
                </Link>
              </div>
            </div>
          </div>

          {/* Sectoral Quick Links */}
          <div className="mb-4">
            <div className="section-header">
              <span>🏭 Sectors Today</span>
            </div>
            <div className="bg-white border border-t-0 border-[#E0E0E0] p-3">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                <Link href="/stocks/nifty-it-stocks-today" className="border border-[#E0E0E0] rounded p-2 hover:border-[#1565C0] hover:bg-[#F5F7FA] text-center">
                  <div className="font-semibold text-[#1A1A1A]">🖥️ IT</div>
                  <div className="text-xs text-[#666]">Nifty IT</div>
                </Link>
                <Link href="/stocks/nifty-pharma-stocks-today" className="border border-[#E0E0E0] rounded p-2 hover:border-[#1565C0] hover:bg-[#F5F7FA] text-center">
                  <div className="font-semibold text-[#1A1A1A]">💊 Pharma</div>
                  <div className="text-xs text-[#666]">Nifty Pharma</div>
                </Link>
                <Link href="/stocks/nifty-auto-stocks-today" className="border border-[#E0E0E0] rounded p-2 hover:border-[#1565C0] hover:bg-[#F5F7FA] text-center">
                  <div className="font-semibold text-[#1A1A1A]">🚗 Auto</div>
                  <div className="text-xs text-[#666]">Nifty Auto</div>
                </Link>
                <Link href="/stocks/nifty-realty-stocks-today" className="border border-[#E0E0E0] rounded p-2 hover:border-[#1565C0] hover:bg-[#F5F7FA] text-center">
                  <div className="font-semibold text-[#1A1A1A]">🏠 Realty</div>
                  <div className="text-xs text-[#666]">Nifty Realty</div>
                </Link>
                <Link href="/stocks/nifty-ev-stocks-today" className="border border-[#E0E0E0] rounded p-2 hover:border-[#1565C0] hover:bg-[#F5F7FA] text-center">
                  <div className="font-semibold text-[#1A1A1A]">⚡ EV</div>
                  <div className="text-xs text-[#666]">Nifty EV</div>
                </Link>
              </div>
            </div>
          </div>

          {/* Latest Market Updates */}
          <div className="mb-4">
            <div className="section-header">
              <span>📰 Latest Market Updates</span>
            </div>
            <div className="bg-white border border-t-0 border-[#E0E0E0] p-4">
              {stocks.slice(0, 10).map(s => (
                <Link key={s.slug} href={`/stocks/${s.slug}`} className={`news-item ${s.eventType === 'RISE' ? 'rise' : 'fall'} block hover:bg-[#F5F7FA]`}>
                  <div className="font-semibold text-[#1A1A1A] hover:text-[#1565C0] text-sm">
                    Why Did {s.companyName} ({s.symbol}) {s.eventType === 'RISE' ? 'Rise' : 'Fall'} {s.changePercent.toFixed(1)}% Today?
                  </div>
                  <div className="text-xs text-[#666] mt-1">
                    {format(s.publishedAt, 'dd MMM yyyy, h:mm a')} • Stocks
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:w-[35%]">
          {/* Market Snapshot Widget */}
          <div className="mb-4 sticky top-[120px]">
            <LiveSidebar />

            {/* Top News Widget */}
            <div className="mt-4">
              <div className="section-header"><span>Top News Today</span></div>
              <div className="bg-white border border-t-0 border-[#E0E0E0]">
                {stocks.slice(0, 5).map(s => (
                  <Link key={s.slug} href={`/stocks/${s.slug}`} className="block p-3 border-b border-[#E0E0E0] last:border-b-0 hover:bg-[#F5F7FA]">
                    <div className="text-sm font-semibold text-[#1A1A1A] line-clamp-2 hover:text-[#1565C0]">
                      {s.companyName} {s.eventType === 'RISE' ? 'rises' : 'falls'} {s.changePercent.toFixed(1)}%
                    </div>
                    <div className="text-xs text-[#666] mt-1">{format(s.publishedAt, 'h:mm a')}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
