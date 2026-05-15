import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stock Market Updates — Why Stocks Rose or Fell Today',
  description: 'Latest Indian stock market movements. Find out why NSE/BSE stocks rose or fell today with news and analysis.',
}

export const dynamic = 'force-dynamic'

export default async function StocksPage() {
  const events = await prisma.stockEvent.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    take: 50,
    select: { slug: true, companyName: true, symbol: true, eventType: true, changePercent: true, eventDate: true, metaDesc: true },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Stock Market Updates</h1>
      <p className="text-gray-600 mb-6">Latest stock movements on NSE/BSE with reasons and analysis.</p>
      {events.length === 0 && <p className="text-gray-500">No stock events yet. Check back after market close.</p>}
      <div className="space-y-3">
        {events.map(e => (
          <Link key={e.slug} href={`/stocks/${e.slug}`} className="block p-4 bg-white rounded-lg border hover:shadow-md transition">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold">{e.companyName} ({e.symbol})</h2>
                <p className="text-sm text-gray-500 mt-1">{e.metaDesc.slice(0, 100)}...</p>
              </div>
              <span className={`text-lg font-bold ${e.eventType === 'RISE' ? 'text-green-600' : 'text-red-600'}`}>
                {e.eventType === 'RISE' ? '▲' : '▼'} {e.changePercent.toFixed(1)}%
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
