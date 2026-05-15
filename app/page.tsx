import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { format } from 'date-fns'

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
      {/* Market Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-0 bg-white border border-[#E0E0E0] rounded mb-4 overflow-x-auto">
        {indices.slice(0, 3).map(i => (
          <div key={i.slug} className="p-3 border-r border-[#E0E0E0] last:border-r-0">
            <div className="text-xs text-[#666] font-semibold uppercase">{i.indexName}</div>
            <div className="font-mono-price text-lg font-bold">{i.closeValue.toLocaleString('en-IN')}</div>
            <div className={`text-xs font-bold ${i.eventType === 'RISE' ? 'text-rise' : 'text-fall'}`}>
              {i.eventType === 'RISE' ? '▲' : '▼'} {Math.round(i.changePoints)} ({i.changePercent.toFixed(2)}%)
            </div>
          </div>
        ))}
        {metals.slice(0, 2).map(m => (
          <div key={m.slug} className="p-3 border-r border-[#E0E0E0] last:border-r-0">
            <div className="text-xs text-[#666] font-semibold uppercase">{m.metal} {m.carat || ''}</div>
            <div className="font-mono-price text-lg font-bold">₹{m.pricePerGram.toFixed(0)}/g</div>
            <div className={`text-xs font-bold ${m.eventType === 'RISE' ? 'text-rise' : 'text-fall'}`}>
              {m.eventType === 'RISE' ? '▲' : '▼'} {m.changePercent.toFixed(2)}%
            </div>
          </div>
        ))}
        <div className="p-3">
          <div className="text-xs text-[#666] font-semibold uppercase">USD/INR</div>
          <div className="font-mono-price text-lg font-bold">₹83.45</div>
          <div className="text-xs font-bold text-fall">▼ -0.05%</div>
        </div>
      </div>

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
            <div className="section-header"><span>Market Snapshot</span></div>
            <div className="bg-white border border-t-0 border-[#E0E0E0]">
              {indices.map(i => (
                <Link key={i.slug} href={`/indices/${i.slug}`} className="flex justify-between items-center p-3 border-b border-[#E0E0E0] last:border-b-0 hover:bg-[#F5F7FA]">
                  <span className="font-semibold text-sm">{i.indexName}</span>
                  <div className="text-right">
                    <div className="font-mono-price text-sm font-bold">{i.closeValue.toLocaleString('en-IN')}</div>
                    <div className={`text-xs font-bold ${i.eventType === 'RISE' ? 'text-rise' : 'text-fall'}`}>
                      {i.eventType === 'RISE' ? '▲' : '▼'} {i.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Gold Rate Widget */}
            <div className="mt-4">
              <div className="section-header"><span>Gold Rate Today</span></div>
              <div className="bg-white border border-t-0 border-[#E0E0E0] p-4">
                {metals.length > 0 ? metals.map(m => (
                  <Link key={m.slug} href={`/gold/${m.slug}`} className="flex justify-between items-center py-2 border-b border-[#E0E0E0] last:border-b-0">
                    <span className="text-sm font-semibold">{m.metal} {m.carat || ''}</span>
                    <div className="text-right">
                      <span className="font-mono-price font-bold">₹{m.pricePerGram.toFixed(0)}/g</span>
                      <span className={`ml-2 text-xs font-bold ${m.eventType === 'RISE' ? 'text-rise' : 'text-fall'}`}>
                        {m.eventType === 'RISE' ? '▲' : '▼'} {m.changePercent.toFixed(1)}%
                      </span>
                    </div>
                  </Link>
                )) : <p className="text-sm text-[#666]">No gold data yet</p>}
              </div>
            </div>

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
