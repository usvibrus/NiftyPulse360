import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

export const metadata: Metadata = {
  title: 'Sectors — Indian Stock Market Sector Performance',
  description: 'Daily updates on every NSE/BSE sector. Find sector-wise gainers, losers, and trend explanations.',
  alternates: { canonical: '/sectors' },
  openGraph: {
    title: 'Sectors — NiftyPulse360',
    description: 'Daily sector performance for Indian equities.',
    type: 'website',
    url: `${SITE}/sectors`,
    siteName: 'NiftyPulse360',
    locale: 'en_IN',
  },
}

function sectorToSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default async function SectorsIndex() {
  const grouped = await prisma.stockEvent.groupBy({
    by: ['sector'],
    where: { isPublished: true, sector: { not: null } },
    _count: { sector: true },
    orderBy: { _count: { sector: 'desc' } },
    take: 50,
  })

  const sectors = grouped
    .filter(g => g.sector && g.sector !== 'Unknown')
    .map(g => ({ name: g.sector as string, count: g._count.sector, slug: sectorToSlug(g.sector as string) }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <nav className="text-xs text-[#666] mb-3" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#1565C0]">Home</Link> › <span className="text-[#1A1A1A]">Sectors</span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-bold mb-2">Indian Stock Market Sectors</h1>
      <p className="text-sm text-[#666] mb-6">Browse by sector to see all recent movers in each industry. Click a sector for the full list of analyses.</p>

      {sectors.length === 0 ? (
        <p className="text-sm text-[#666]">Sector data is being collected. Check back shortly.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {sectors.map(s => (
            <Link key={s.slug} href={`/sectors/${s.slug}`} className="bg-white border border-[#E0E0E0] rounded p-4 hover:border-[#1565C0] hover:bg-[#F5F7FA]">
              <div className="font-semibold text-[#1A1A1A]">{s.name}</div>
              <div className="text-xs text-[#666] mt-1">{s.count} recent {s.count === 1 ? 'analysis' : 'analyses'}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
