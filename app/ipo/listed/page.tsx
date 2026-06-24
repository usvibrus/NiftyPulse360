// IPO page optimized
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Recently Listed IPOs 2026 — Listing Day Gains & Performance | NiftyPulse360',
  description: 'Track listing day performance of all recently listed IPOs in India 2026. See listing price, gains/loss percentage, and compare with issue price.',
  keywords: ['IPO listing today', 'IPO listing price', 'IPO listing gains', 'recently listed IPO', 'IPO result today', 'IPO listing premium'],
  alternates: { canonical: '/ipo/listed' },
}

export default async function ListedIpoPage() {
  const ipos = await prisma.ipoEvent.findMany({
    where: { isPublished: true, status: 'LISTED' },
    orderBy: { listingDate: 'desc' },
    take: 50,
    select: { slug: true, companyName: true, ipoType: true, priceBandMax: true, issuePrice: true, listingPrice: true, listingGainLoss: true, listingDayClose: true, listingDate: true, gmpValue: true },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="section-header mb-0"><span>Recently Listed IPOs</span></div>
        <div className="bg-white border border-t-0 border-[#E0E0E0] p-5">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Recently Listed IPOs 2026 — Listing Day Performance</h1>
          <p className="text-sm text-[#666]">Listing day gains and performance for all recently listed IPOs. Compare issue price vs listing price.</p>
        </div>
      </div>

      {ipos.length > 0 ? (
        <div className="bg-white border border-[#E0E0E0] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F7FA] text-xs text-[#666] uppercase">
                <th className="text-left p-3 pl-4">Company</th>
                <th className="text-right p-3">Issue Price</th>
                <th className="text-right p-3">Listing Price</th>
                <th className="text-right p-3">Gain/Loss</th>
                <th className="text-right p-3 hidden md:table-cell">Day Close</th>
                <th className="text-right p-3 pr-4 hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {ipos.map(ipo => {
                const price = ipo.issuePrice || ipo.priceBandMax
                return (
                  <tr key={ipo.slug} className="border-t border-[#E0E0E0] hover:bg-[#F5F7FA]">
                    <td className="p-3 pl-4">
                      <Link href={`/ipo/${ipo.slug}`} className="font-semibold text-[#1A1A1A] hover:text-[#1565C0]">{ipo.companyName}</Link>
                      <div className="text-xs text-[#666]">{ipo.ipoType}</div>
                    </td>
                    <td className="text-right p-3 font-mono-price">{price ? `₹${price}` : '—'}</td>
                    <td className="text-right p-3 font-mono-price font-bold">{ipo.listingPrice ? `₹${ipo.listingPrice}` : '—'}</td>
                    <td className="text-right p-3">
                      {ipo.listingGainLoss !== null ? (
                        <span className={`font-bold ${ipo.listingGainLoss >= 0 ? 'text-rise' : 'text-fall'}`}>
                          {ipo.listingGainLoss >= 0 ? '▲ +' : '▼ '}{ipo.listingGainLoss.toFixed(2)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="text-right p-3 font-mono-price hidden md:table-cell">{ipo.listingDayClose ? `₹${ipo.listingDayClose}` : '—'}</td>
                    <td className="text-right p-3 pr-4 text-[#666] hidden md:table-cell">{ipo.listingDate ? format(ipo.listingDate, 'dd MMM yyyy') : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-[#E0E0E0] p-8 text-center">
          <p className="text-[#666]">No recently listed IPOs to show.</p>
          <Link href="/ipo" className="inline-block mt-3 text-sm font-semibold text-[#1565C0]">← Back to IPO Hub</Link>
        </div>
      )}
    </div>
  )
}
