import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stock Market Updates — Why Stocks Rose or Fell Today',
  description: 'Latest Indian stock market movements. Find out why NSE/BSE stocks rose or fell today with news and analysis.',
  alternates: { canonical: '/stocks' },
}

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 30

export default async function StocksPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const skip = (currentPage - 1) * PAGE_SIZE

  const [events, totalCount] = await Promise.all([
    prisma.stockEvent.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      select: { slug: true, companyName: true, symbol: true, eventType: true, changePercent: true, eventDate: true, metaDesc: true, sector: true, closePrice: true },
    }),
    prisma.stockEvent.count({ where: { isPublished: true } }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <nav className="text-xs text-[#666] mb-3">
        <Link href="/" className="hover:text-[#1565C0]">Home</Link> › <span className="text-[#1A1A1A]">Stocks</span>
      </nav>

      <h1 className="text-xl md:text-2xl font-bold mb-2">Stock Market Updates</h1>
      <p className="text-sm text-[#666] mb-4">
        Latest stock movements on NSE/BSE with reasons, news and analysis. Showing {events.length} of {totalCount} stocks.
      </p>

      {/* Quick category links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-6">
        <Link href="/stocks/top-gainers-today" className="bg-white border border-[#E0E0E0] rounded p-3 hover:border-[#1565C0]">
          <div className="font-semibold text-[#1A1A1A]">📈 Top Gainers Today</div>
          <div className="text-xs text-[#666] mt-1">Best performers</div>
        </Link>
        <Link href="/stocks/top-losers-today" className="bg-white border border-[#E0E0E0] rounded p-3 hover:border-[#1565C0]">
          <div className="font-semibold text-[#1A1A1A]">📉 Top Losers Today</div>
          <div className="text-xs text-[#666] mt-1">Worst performers</div>
        </Link>
        <Link href="/indices" className="bg-white border border-[#E0E0E0] rounded p-3 hover:border-[#1565C0]">
          <div className="font-semibold text-[#1A1A1A]">📊 Indices</div>
          <div className="text-xs text-[#666] mt-1">Nifty, Sensex</div>
        </Link>
        <Link href="/gold" className="bg-white border border-[#E0E0E0] rounded p-3 hover:border-[#1565C0]">
          <div className="font-semibold text-[#1A1A1A]">🪙 Gold &amp; Silver</div>
          <div className="text-xs text-[#666] mt-1">Metal rates</div>
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="text-[#666]">No stock events yet. Check back after market close.</p>
      ) : (
        <div className="space-y-3 mb-6">
          {events.map(e => (
            <Link key={e.slug} href={`/stocks/${e.slug}`} className="block p-4 bg-white rounded border border-[#E0E0E0] hover:border-[#1565C0] transition">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-[#1A1A1A] hover:text-[#1565C0]">{e.companyName} ({e.symbol})</h2>
                  <p className="text-xs text-[#666] mt-1">{e.sector || 'NSE'} • {new Date(e.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  <p className="text-sm text-[#444] mt-2 line-clamp-2">{e.metaDesc}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono-price font-bold">₹{e.closePrice.toFixed(2)}</div>
                  <div className={`text-sm font-bold ${e.eventType === 'RISE' ? 'text-rise' : 'text-fall'}`}>
                    {e.eventType === 'RISE' ? '▲ +' : '▼ -'}{e.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-between border-t border-[#E0E0E0] pt-4 mb-6" aria-label="Pagination">
          <div className="text-sm text-[#666]">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link href={`/stocks${currentPage - 1 > 1 ? `?page=${currentPage - 1}` : ''}`} className="px-3 py-2 text-sm bg-white border border-[#E0E0E0] rounded hover:border-[#1565C0]">
                ← Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link href={`/stocks?page=${currentPage + 1}`} className="px-3 py-2 text-sm bg-[#1565C0] text-white rounded hover:bg-[#0d47a1]">
                Next →
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  )
}
