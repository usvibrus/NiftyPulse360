import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'

export const revalidate = 3600

export default async function HomePage() {
  const [stocks, indices, metals, commodities] = await Promise.all([
    prisma.stockEvent.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' }, take: 10, select: { slug: true, companyName: true, symbol: true, eventType: true, changePercent: true, eventDate: true } }),
    prisma.indexEvent.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' }, take: 5, select: { slug: true, indexName: true, eventType: true, changePercent: true, changePoints: true, eventDate: true } }),
    prisma.metalEvent.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' }, take: 5, select: { slug: true, metal: true, eventType: true, changePercent: true, pricePerGram: true, eventDate: true } }),
    prisma.commodityEvent.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' }, take: 5, select: { slug: true, commodity: true, eventType: true, changePercent: true, priceUSD: true, eventDate: true } }),
  ])

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-2">India&apos;s Real-Time Market Update Hub</h1>
        <p className="text-gray-600">Find out why stocks, indices, gold and commodities moved today with news and analysis.</p>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-xl font-semibold mb-3 border-b pb-2">Latest Stock Movements</h2>
          {stocks.length === 0 && <p className="text-gray-500 text-sm">No stock events yet. Data will appear after the first market close.</p>}
          <ul className="space-y-2">
            {stocks.map(s => (
              <li key={s.slug}>
                <Link href={`/stocks/${s.slug}`} className="flex justify-between items-center p-2 rounded hover:bg-gray-100">
                  <span className="font-medium">{s.companyName} ({s.symbol})</span>
                  <span className={`text-sm font-bold ${s.eventType === 'RISE' ? 'text-green-600' : 'text-red-600'}`}>
                    {s.eventType === 'RISE' ? '▲' : '▼'} {s.changePercent.toFixed(1)}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 border-b pb-2">Indices</h2>
          {indices.length === 0 && <p className="text-gray-500 text-sm">No index events yet.</p>}
          <ul className="space-y-2">
            {indices.map(i => (
              <li key={i.slug}>
                <Link href={`/indices/${i.slug}`} className="flex justify-between items-center p-2 rounded hover:bg-gray-100">
                  <span className="font-medium">{i.indexName}</span>
                  <span className={`text-sm font-bold ${i.eventType === 'RISE' ? 'text-green-600' : 'text-red-600'}`}>
                    {i.eventType === 'RISE' ? '▲' : '▼'} {Math.round(i.changePoints)} pts
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="text-xl font-semibold mb-3 border-b pb-2 mt-6">Gold & Silver</h2>
          {metals.length === 0 && <p className="text-gray-500 text-sm">No metal events yet.</p>}
          <ul className="space-y-2">
            {metals.map(m => (
              <li key={m.slug}>
                <Link href={`/gold/${m.slug}`} className="flex justify-between items-center p-2 rounded hover:bg-gray-100">
                  <span className="font-medium">{m.metal === 'GOLD' ? '🪙 Gold' : '🥈 Silver'}</span>
                  <span className={`text-sm font-bold ${m.eventType === 'RISE' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.eventType === 'RISE' ? '▲' : '▼'} {m.changePercent.toFixed(1)}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="text-xl font-semibold mb-3 border-b pb-2 mt-6">Commodities</h2>
          {commodities.length === 0 && <p className="text-gray-500 text-sm">No commodity events yet.</p>}
          <ul className="space-y-2">
            {commodities.map(c => (
              <li key={c.slug}>
                <Link href={`/commodities/${c.slug}`} className="flex justify-between items-center p-2 rounded hover:bg-gray-100">
                  <span className="font-medium">{c.commodity.replace('_', ' ')}</span>
                  <span className={`text-sm font-bold ${c.eventType === 'RISE' ? 'text-green-600' : 'text-red-600'}`}>
                    {c.eventType === 'RISE' ? '▲' : '▼'} {c.changePercent.toFixed(1)}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
