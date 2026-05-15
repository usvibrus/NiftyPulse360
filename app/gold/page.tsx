import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gold & Silver Price Updates India — Why Gold Rose or Fell Today',
  description: 'Latest gold and silver price movements in India with reasons and analysis.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export default async function GoldPage() {
  const events = await prisma.metalEvent.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    take: 50,
    select: { slug: true, metal: true, eventType: true, changePercent: true, pricePerGram: true, eventDate: true },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gold & Silver Price Updates</h1>
      <p className="text-gray-600 mb-6">Daily gold and silver price movements in India with reasons.</p>
      {events.length === 0 && <p className="text-gray-500">No metal events yet.</p>}
      <div className="space-y-3">
        {events.map(e => (
          <Link key={e.slug} href={`/gold/${e.slug}`} className="block p-4 bg-white rounded-lg border hover:shadow-md transition">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">{e.metal === 'GOLD' ? '🪙 Gold' : '🥈 Silver'}</h2>
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
