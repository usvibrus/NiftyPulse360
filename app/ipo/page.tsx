// Page optimized
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

export const metadata: Metadata = {
  title: 'IPO 2026 — Upcoming, Open & Listed IPOs in India | NiftyPulse360',
  description: 'Track all upcoming, open, and recently listed IPOs in India. Get GMP, subscription status, price band, lot size, and listing day performance for mainboard & SME IPOs.',
  keywords: ['IPO 2026', 'upcoming IPO', 'IPO GMP today', 'SME IPO', 'IPO subscription status', 'IPO listing today'],
  alternates: { canonical: '/ipo' },
  openGraph: {
    title: 'IPO 2026 — Upcoming, Open & Listed IPOs India | NiftyPulse360',
    description: 'Track all IPOs: GMP, subscription status, listing gains. Mainboard & SME.',
    url: `${SITE}/ipo`,
    type: 'website',
    siteName: 'NiftyPulse360',
  },
}

export default async function IpoHubPage() {
  const [open, upcoming, listed] = await Promise.all([
    prisma.ipoEvent.findMany({
      where: { isPublished: true, status: { in: ['OPEN', 'CLOSED', 'ALLOTMENT'] } },
      orderBy: { openDate: 'desc' },
      take: 20,
      select: { slug: true, companyName: true, ipoType: true, priceBandMax: true, lotSize: true, issueSizeCr: true, openDate: true, closeDate: true, listingDate: true, gmpValue: true, status: true, subscriptionData: true },
    }),
    prisma.ipoEvent.findMany({
      where: { isPublished: true, status: 'UPCOMING' },
      orderBy: { openDate: 'asc' },
      take: 20,
      select: { slug: true, companyName: true, ipoType: true, priceBandMax: true, lotSize: true, issueSizeCr: true, openDate: true, closeDate: true, gmpValue: true, status: true },
    }),
    prisma.ipoEvent.findMany({
      where: { isPublished: true, status: 'LISTED' },
      orderBy: { listingDate: 'desc' },
      take: 20,
      select: { slug: true, companyName: true, ipoType: true, priceBandMax: true, listingPrice: true, listingGainLoss: true, listingDate: true, gmpValue: true, status: true },
    }),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="section-header mb-0"><span>IPO Tracker 2026</span></div>
        <div className="bg-white border border-t-0 border-[#E0E0E0] p-5">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">IPO 2026 — Upcoming, Open &amp; Listed IPOs</h1>
          <p className="text-sm text-[#666]">Track all Indian IPOs: GMP, subscription status, price band, listing gains. Mainboard &amp; SME.</p>
          <div className="flex gap-3 mt-3 text-sm">
            <Link href="/ipo/gmp" className="text-[#1565C0] font-semibold hover:underline">GMP Tracker →</Link>
            <Link href="/ipo/subscription-status" className="text-[#1565C0] font-semibold hover:underline">Subscription Status →</Link>
            <Link href="/ipo/upcoming" className="text-[#1565C0] font-semibold hover:underline">Upcoming IPOs →</Link>
            <Link href="/ipo/listed" className="text-[#1565C0] font-semibold hover:underline">Listed IPOs →</Link>
          </div>
        </div>
      </div>

      {/* Current / Open IPOs */}
      {open.length > 0 && (
        <div className="mb-6">
          <div className="section-header"><span>Current IPOs</span></div>
          <div className="bg-white border border-t-0 border-[#E0E0E0]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F7FA] text-xs text-[#666] uppercase">
                  <th className="text-left p-2 pl-4">Company</th>
                  <th className="text-right p-2">Price</th>
                  <th className="text-right p-2">GMP</th>
                  <th className="text-right p-2">Size</th>
                  <th className="text-right p-2 pr-4 hidden md:table-cell">Dates</th>
                </tr>
              </thead>
              <tbody>
                {open.map(ipo => (
                  <tr key={ipo.slug} className="border-t border-[#E0E0E0] hover:bg-[#F5F7FA]">
                    <td className="p-2 pl-4">
                      <Link href={`/ipo/${ipo.slug}`} className="font-semibold text-[#1A1A1A] hover:text-[#1565C0]">{ipo.companyName}</Link>
                      <div className="text-xs text-[#666]">{ipo.ipoType} · {ipo.status}</div>
                    </td>
                    <td className="text-right p-2 font-mono-price">{ipo.priceBandMax ? `₹${ipo.priceBandMax}` : '—'}</td>
                    <td className="text-right p-2">
                      {ipo.gmpValue !== null ? (
                        <span className={ipo.gmpValue >= 0 ? 'text-rise font-bold' : 'text-fall font-bold'}>
                          {ipo.gmpValue >= 0 ? '+' : ''}₹{ipo.gmpValue}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="text-right p-2 text-[#666]">{ipo.issueSizeCr ? `₹${ipo.issueSizeCr.toFixed(0)} Cr` : '—'}</td>
                    <td className="text-right p-2 pr-4 text-xs text-[#666] hidden md:table-cell">
                      {ipo.openDate ? format(ipo.openDate, 'dd MMM') : '—'} – {ipo.closeDate ? format(ipo.closeDate, 'dd MMM') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upcoming IPOs */}
      {upcoming.length > 0 && (
        <div className="mb-6">
          <div className="section-header">
            <span>Upcoming IPOs</span>
            <Link href="/ipo/upcoming" className="text-xs font-normal opacity-80 hover:opacity-100">View All →</Link>
          </div>
          <div className="bg-white border border-t-0 border-[#E0E0E0]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F7FA] text-xs text-[#666] uppercase">
                  <th className="text-left p-2 pl-4">Company</th>
                  <th className="text-right p-2">Price Band</th>
                  <th className="text-right p-2">Lot Size</th>
                  <th className="text-right p-2 pr-4 hidden md:table-cell">Open Date</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.slice(0, 10).map(ipo => (
                  <tr key={ipo.slug} className="border-t border-[#E0E0E0] hover:bg-[#F5F7FA]">
                    <td className="p-2 pl-4">
                      <Link href={`/ipo/${ipo.slug}`} className="font-semibold text-[#1A1A1A] hover:text-[#1565C0]">{ipo.companyName}</Link>
                      <div className="text-xs text-[#666]">{ipo.ipoType}</div>
                    </td>
                    <td className="text-right p-2 font-mono-price">{ipo.priceBandMax ? `₹${ipo.priceBandMax}` : 'TBA'}</td>
                    <td className="text-right p-2">{ipo.lotSize || 'TBA'}</td>
                    <td className="text-right p-2 pr-4 text-[#666] hidden md:table-cell">{ipo.openDate ? format(ipo.openDate, 'dd MMM yyyy') : 'TBA'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recently Listed */}
      {listed.length > 0 && (
        <div className="mb-6">
          <div className="section-header">
            <span>Recently Listed</span>
            <Link href="/ipo/listed" className="text-xs font-normal opacity-80 hover:opacity-100">View All →</Link>
          </div>
          <div className="bg-white border border-t-0 border-[#E0E0E0]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F7FA] text-xs text-[#666] uppercase">
                  <th className="text-left p-2 pl-4">Company</th>
                  <th className="text-right p-2">Issue Price</th>
                  <th className="text-right p-2">Listing Price</th>
                  <th className="text-right p-2 pr-4">Gain/Loss</th>
                </tr>
              </thead>
              <tbody>
                {listed.slice(0, 10).map(ipo => (
                  <tr key={ipo.slug} className="border-t border-[#E0E0E0] hover:bg-[#F5F7FA]">
                    <td className="p-2 pl-4">
                      <Link href={`/ipo/${ipo.slug}`} className="font-semibold text-[#1A1A1A] hover:text-[#1565C0]">{ipo.companyName}</Link>
                      <div className="text-xs text-[#666]">{ipo.ipoType} · {ipo.listingDate ? format(ipo.listingDate, 'dd MMM') : ''}</div>
                    </td>
                    <td className="text-right p-2 font-mono-price">{ipo.priceBandMax ? `₹${ipo.priceBandMax}` : '—'}</td>
                    <td className="text-right p-2 font-mono-price">{ipo.listingPrice ? `₹${ipo.listingPrice}` : '—'}</td>
                    <td className="text-right p-2 pr-4">
                      {ipo.listingGainLoss !== null ? (
                        <span className={`font-bold ${ipo.listingGainLoss >= 0 ? 'text-rise' : 'text-fall'}`}>
                          {ipo.listingGainLoss >= 0 ? '+' : ''}{ipo.listingGainLoss.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {open.length === 0 && upcoming.length === 0 && listed.length === 0 && (
        <div className="bg-white border border-[#E0E0E0] p-8 text-center">
          <p className="text-lg font-bold text-[#1A1A1A] mb-2">IPO Tracker Coming Soon</p>
          <p className="text-sm text-[#666]">We are setting up the IPO tracker. Check back soon for upcoming, open, and listed IPOs.</p>
          <Link href="/" className="inline-block mt-4 bg-[#1565C0] text-white px-5 py-2 rounded text-sm font-semibold hover:bg-[#0D47A1]">← Back to Home</Link>
        </div>
      )}
    </div>
  )
}
