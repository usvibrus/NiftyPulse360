import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crude Oil & Commodity Price Updates — Why Prices Rose or Fell Today',
  description: 'Latest crude oil, natural gas and currency movements with reasons and analysis.',
}

export const revalidate = 3600

export default async function CommoditiesPage() {
  const [commodities, currencies] = await Promise.all([
    prisma.commodityEvent.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' }, take: 30, select: { slug: true, commodity: true, eventType: true, changePercent: true, priceUSD: true, eventDate: true } }),
    prisma.currencyEvent.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' }, take: 20, select: { slug: true, pair: true, eventType: true, changePercent: true, rateValue: true, eventDate: true } }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Commodities & Currency Updates</h1>

      <h2 className="text-xl font-semibold mb-3 mt-6">Crude Oil & Commodities</h2>
      {commodities.length === 0 && <p className="text-gray-500">No commodity events yet.</p>}
      <div className="space-y-3">
        {commodities.map(e => (
          <Link key={e.slug} href={`/commodities/${e.slug}`} className="block p-4 bg-white rounded-lg border hover:shadow-md transition">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{e.commodity.replace('_', ' ')}</h3>
              <span className={`text-lg font-bold ${e.eventType === 'RISE' ? 'text-green-600' : 'text-red-600'}`}>
                {e.eventType === 'RISE' ? '▲' : '▼'} {e.changePercent.toFixed(1)}%
              </span>
            </div>
          </Link>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-3 mt-8">Currency (INR)</h2>
      {currencies.length === 0 && <p className="text-gray-500">No currency events yet.</p>}
      <div className="space-y-3">
        {currencies.map(e => (
          <Link key={e.slug} href={`/commodities/${e.slug}`} className="block p-4 bg-white rounded-lg border hover:shadow-md transition">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{e.pair.replace('_', '/')}</h3>
              <span className={`text-lg font-bold ${e.eventType === 'RISE' ? 'text-green-600' : 'text-red-600'}`}>
                ₹{e.rateValue.toFixed(2)} ({e.eventType === 'RISE' ? '▲' : '▼'} {e.changePercent.toFixed(2)}%)
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
