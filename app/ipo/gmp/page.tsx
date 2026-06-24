// IPO page optimized
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

export const metadata: Metadata = {
  title: 'IPO GMP Today — Grey Market Premium for All IPOs 2026 | NiftyPulse360',
  description: 'Live IPO GMP (Grey Market Premium) for all upcoming and open IPOs in India 2026. Check expected listing price, subscription status, and premium for mainboard & SME IPOs.',
  keywords: ['IPO GMP today', 'grey market premium', 'IPO GMP 2026', 'live IPO GMP', 'SME IPO GMP', 'expected listing price'],
  alternates: { canonical: '/ipo/gmp' },
  openGraph: {
    title: 'IPO GMP Today — Grey Market Premium All IPOs 2026',
    description: 'Live GMP for all upcoming and open IPOs. Check expected listing price.',
    url: `${SITE}/ipo/gmp`,
    type: 'website',
  },
}

export default async function IpoGmpPage() {
  const ipos = await prisma.ipoEvent.findMany({
    where: { isPublished: true, status: { in: ['UPCOMING', 'OPEN', 'CLOSED', 'ALLOTMENT'] } },
    orderBy: { gmpUpdatedAt: 'desc' },
    select: { slug: true, companyName: true, ipoType: true, priceBandMax: true, issuePrice: true, gmpValue: true, gmpPercent: true, gmpUpdatedAt: true, openDate: true, listingDate: true, status: true },
  })

  const listedRecent = await prisma.ipoEvent.findMany({
    where: { isPublished: true, status: 'LISTED', listingGainLoss: { not: null } },
    orderBy: { listingDate: 'desc' },
    take: 10,
    select: { slug: true, companyName: true, ipoType: true, priceBandMax: true, listingPrice: true, listingGainLoss: true, gmpValue: true },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="section-header mb-0"><span>IPO GMP Today</span></div>
        <div className="bg-white border border-t-0 border-[#E0E0E0] p-5">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">IPO GMP Today — Grey Market Premium 2026</h1>
          <p className="text-sm text-[#666]">Live Grey Market Premium (GMP) for all upcoming and open IPOs. GMP indicates expected listing premium/discount over issue price.</p>
        </div>
      </div>

      {/* Active IPO GMP Table */}
      {ipos.length > 0 && (
        <div className="mb-6">
          <div className="section-header"><span>Active IPOs — GMP</span></div>
          <div className="bg-white border border-t-0 border-[#E0E0E0] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F7FA] text-xs text-[#666] uppercase">
                  <th className="text-left p-2 pl-4">IPO</th>
                  <th className="text-right p-2">Price</th>
                  <th className="text-right p-2">GMP</th>
                  <th className="text-right p-2">Expected Listing</th>
                  <th className="text-right p-2 pr-4 hidden md:table-cell">Status</th>
                </tr>
              </thead>
              <tbody>
                {ipos.map(ipo => {
                  const price = ipo.issuePrice || ipo.priceBandMax || 0
                  const expectedListing = price && ipo.gmpValue !== null ? price + ipo.gmpValue : null
                  return (
                    <tr key={ipo.slug} className="border-t border-[#E0E0E0] hover:bg-[#F5F7FA]">
                      <td className="p-2 pl-4">
                        <Link href={`/ipo/${ipo.slug}`} className="font-semibold text-[#1A1A1A] hover:text-[#1565C0]">{ipo.companyName}</Link>
                        <div className="text-xs text-[#666]">{ipo.ipoType}</div>
                      </td>
                      <td className="text-right p-2 font-mono-price">{price ? `₹${price}` : '—'}</td>
                      <td className="text-right p-2">
                        {ipo.gmpValue !== null ? (
                          <span className={`font-bold ${ipo.gmpValue >= 0 ? 'text-rise' : 'text-fall'}`}>
                            {ipo.gmpValue >= 0 ? '+' : ''}₹{ipo.gmpValue}
                            {ipo.gmpPercent ? ` (${ipo.gmpPercent > 0 ? '+' : ''}${ipo.gmpPercent.toFixed(0)}%)` : ''}
                          </span>
                        ) : <span className="text-[#999]">—</span>}
                      </td>
                      <td className="text-right p-2 font-mono-price font-bold">{expectedListing ? `₹${expectedListing.toFixed(0)}` : '—'}</td>
                      <td className="text-right p-2 pr-4 text-xs hidden md:table-cell">
                        <span className="px-2 py-0.5 rounded bg-[#F5F7FA] text-[#666]">{ipo.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recently Listed — GMP vs Actual */}
      {listedRecent.length > 0 && (
        <div className="mb-6">
          <div className="section-header"><span>Recently Listed — GMP vs Actual</span></div>
          <div className="bg-white border border-t-0 border-[#E0E0E0] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F7FA] text-xs text-[#666] uppercase">
                  <th className="text-left p-2 pl-4">IPO</th>
                  <th className="text-right p-2">Issue Price</th>
                  <th className="text-right p-2">GMP Was</th>
                  <th className="text-right p-2">Listing Price</th>
                  <th className="text-right p-2 pr-4">Actual Gain</th>
                </tr>
              </thead>
              <tbody>
                {listedRecent.map(ipo => (
                  <tr key={ipo.slug} className="border-t border-[#E0E0E0] hover:bg-[#F5F7FA]">
                    <td className="p-2 pl-4">
                      <Link href={`/ipo/${ipo.slug}`} className="font-semibold text-[#1A1A1A] hover:text-[#1565C0]">{ipo.companyName}</Link>
                    </td>
                    <td className="text-right p-2 font-mono-price">{ipo.priceBandMax ? `₹${ipo.priceBandMax}` : '—'}</td>
                    <td className="text-right p-2">{ipo.gmpValue !== null ? `₹${ipo.gmpValue}` : '—'}</td>
                    <td className="text-right p-2 font-mono-price">{ipo.listingPrice ? `₹${ipo.listingPrice}` : '—'}</td>
                    <td className="text-right p-2 pr-4">
                      <span className={`font-bold ${(ipo.listingGainLoss || 0) >= 0 ? 'text-rise' : 'text-fall'}`}>
                        {(ipo.listingGainLoss || 0) >= 0 ? '+' : ''}{ipo.listingGainLoss?.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-[#FFFDE7] border border-[#FFF59D] rounded p-4 text-sm text-[#666]">
        <strong>Disclaimer:</strong> GMP (Grey Market Premium) is unofficial data sourced from grey market activity. It does not guarantee listing performance. Please invest based on your own research and read the RHP before applying.
      </div>
    </div>
  )
}
