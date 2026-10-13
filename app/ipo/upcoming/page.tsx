import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Upcoming IPOs 2026 — Mainboard & SME IPOs This Month | NiftyPulse360',
  description: 'Complete list of upcoming IPOs in India 2026. Get price band, lot size, opening dates, and GMP for all mainboard and SME IPOs.',
  keywords: ['upcoming IPO 2026', 'upcoming IPO this week', 'new IPO', 'SME IPO upcoming', 'IPO next week', 'upcoming mainboard IPO'],
  alternates: { canonical: '/ipo/upcoming' },
}

export default async function UpcomingIpoPage() {
  const ipos = await prisma.ipoEvent.findMany({
    where: { isPublished: true, status: 'UPCOMING' },
    orderBy: { openDate: 'asc' },
    select: { slug: true, companyName: true, ipoType: true, exchange: true, priceBandMin: true, priceBandMax: true, lotSize: true, issueSizeCr: true, openDate: true, closeDate: true, gmpValue: true },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="section-header mb-0"><span>Upcoming IPOs</span></div>
        <div className="bg-white border border-t-0 border-[#E0E0E0] p-5">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Upcoming IPOs 2026 — Mainboard &amp; SME</h1>
          <p className="text-sm text-[#666]">All upcoming IPOs in India with price band, lot size, dates, and expected GMP.</p>
        </div>
      </div>

      {ipos.length > 0 ? (
        <div className="bg-white border border-[#E0E0E0] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F7FA] text-xs text-[#666] uppercase">
                <th className="text-left p-3 pl-4">Company</th>
                <th className="text-right p-3">Type</th>
                <th className="text-right p-3">Price Band</th>
                <th className="text-right p-3">Lot Size</th>
                <th className="text-right p-3">Issue Size</th>
                <th className="text-right p-3 pr-4 hidden md:table-cell">Open Date</th>
              </tr>
            </thead>
            <tbody>
              {ipos.map(ipo => (
                <tr key={ipo.slug} className="border-t border-[#E0E0E0] hover:bg-[#F5F7FA]">
                  <td className="p-3 pl-4">
                    <Link href={`/ipo/${ipo.slug}`} className="font-semibold text-[#1A1A1A] hover:text-[#1565C0]">{ipo.companyName}</Link>
                  </td>
                  <td className="text-right p-3 text-xs">{ipo.ipoType}</td>
                  <td className="text-right p-3 font-mono-price">{ipo.priceBandMin && ipo.priceBandMax ? `₹${ipo.priceBandMin}-${ipo.priceBandMax}` : 'TBA'}</td>
                  <td className="text-right p-3">{ipo.lotSize || 'TBA'}</td>
                  <td className="text-right p-3">{ipo.issueSizeCr ? `₹${ipo.issueSizeCr.toFixed(0)} Cr` : 'TBA'}</td>
                  <td className="text-right p-3 pr-4 hidden md:table-cell">{ipo.openDate ? format(ipo.openDate, 'dd MMM yyyy') : 'TBA'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-[#E0E0E0] p-8 text-center">
          <p className="text-[#666]">No upcoming IPOs announced. Check back soon.</p>
          <Link href="/ipo" className="inline-block mt-3 text-sm font-semibold text-[#1565C0]">← Back to IPO Hub</Link>
        </div>
      )}
    </div>
  )
}
