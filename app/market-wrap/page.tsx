// Page optimized
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Market Wrap — Daily Indian Stock Market Summary | NiftyPulse360',
  description: 'Daily stock market wrap: Nifty, Sensex, top gainers, losers, and sector performance. Get a quick summary of what happened in the Indian stock market today.',
  keywords: ['market wrap today', 'stock market today', 'nifty today', 'sensex today', 'market summary India'],
  alternates: { canonical: '/market-wrap' },
}

export default async function MarketWrapListPage() {
  const wraps = await prisma.marketWrap.findMany({
    where: { isPublished: true },
    orderBy: { wrapDate: 'desc' },
    take: 30,
    select: { slug: true, wrapDate: true, metaTitle: true, niftyClose: true, niftyChangePct: true, sensexClose: true, sensexChangePct: true },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="section-header mb-0"><span>Market Wrap</span></div>
        <div className="bg-white border border-t-0 border-[#E0E0E0] p-5">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Daily Market Wrap — Stock Market Summary</h1>
          <p className="text-sm text-[#666]">Daily summary of Indian stock markets: Nifty, Sensex, top movers, and sector performance.</p>
        </div>
      </div>

      {wraps.length > 0 ? (
        <div className="bg-white border border-[#E0E0E0]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F7FA] text-xs text-[#666] uppercase">
                <th className="text-left p-3 pl-4">Date</th>
                <th className="text-right p-3">Nifty</th>
                <th className="text-right p-3">Sensex</th>
                <th className="text-right p-3 pr-4">Change</th>
              </tr>
            </thead>
            <tbody>
              {wraps.map(w => (
                <tr key={w.slug} className="border-t border-[#E0E0E0] hover:bg-[#F5F7FA]">
                  <td className="p-3 pl-4">
                    <Link href={`/market-wrap/${w.slug.replace('market-wrap-', '')}`} className="font-semibold text-[#1A1A1A] hover:text-[#1565C0]">
                      {format(w.wrapDate, 'dd MMM yyyy, EEEE')}
                    </Link>
                  </td>
                  <td className="text-right p-3 font-mono-price">{w.niftyClose ? w.niftyClose.toFixed(0) : '—'}</td>
                  <td className="text-right p-3 font-mono-price">{w.sensexClose ? w.sensexClose.toFixed(0) : '—'}</td>
                  <td className="text-right p-3 pr-4">
                    {w.niftyChangePct !== null ? (
                      <span className={`font-bold ${w.niftyChangePct >= 0 ? 'text-rise' : 'text-fall'}`}>
                        {w.niftyChangePct >= 0 ? '▲ +' : '▼ '}{w.niftyChangePct.toFixed(2)}%
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-[#E0E0E0] p-8 text-center">
          <p className="text-[#666]">Market wraps will appear here after the first trading day.</p>
          <Link href="/" className="inline-block mt-3 text-sm font-semibold text-[#1565C0]">← Back to Home</Link>
        </div>
      )}
    </div>
  )
}
