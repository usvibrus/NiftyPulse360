import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nifty 50, Sensex, Bank Nifty — Why Indices Rose or Fell Today',
  description: 'Latest Nifty 50, Sensex, Bank Nifty movements with reasons and analysis.',
}

export const revalidate = 3600

export default async function IndicesPage() {
  const events = await prisma.indexEvent.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    take: 50,
    select: { slug: true, indexName: true, eventType: true, changePercent: true, changePoints: true, eventDate: true },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Index Market Updates</h1>
      <p className="text-gray-600 mb-6">Nifty 50, Sensex, Bank Nifty daily movements with reasons.</p>
      {events.length === 0 && <p className="text-gray-500">No index events yet.</p>}
      <div className="space-y-3">
        {events.map(e => (
          <Link key={e.slug} href={`/indices/${e.slug}`} className="block p-4 bg-white rounded-lg border hover:shadow-md transition">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">{e.indexName}</h2>
              <span className={`text-lg font-bold ${e.eventType === 'RISE' ? 'text-green-600' : 'text-red-600'}`}>
                {e.eventType === 'RISE' ? '▲' : '▼'} {Math.round(e.changePoints)} pts ({e.changePercent.toFixed(1)}%)
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
