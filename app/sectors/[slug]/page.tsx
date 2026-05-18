import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema'

export const dynamic = 'force-dynamic'
export const revalidate = 600

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

function unslugSector(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const sectorName = unslugSector(slug)

  return {
    title: `${sectorName} Stocks Today — Latest Moves & Analysis`,
    description: `Latest news, gainers and losers from the ${sectorName} sector on NSE/BSE. Daily explanations of why ${sectorName} stocks moved.`,
    alternates: { canonical: `/sectors/${slug}` },
    openGraph: {
      title: `${sectorName} Stocks Today — NiftyPulse360`,
      description: `Latest movers from the ${sectorName} sector.`,
      type: 'website',
      url: `${SITE}/sectors/${slug}`,
      siteName: 'NiftyPulse360',
      locale: 'en_IN',
    },
  }
}

export default async function SectorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const sectorName = unslugSector(slug)

  // Find stocks where sector matches (case-insensitive substring)
  const stocks = await prisma.stockEvent.findMany({
    where: {
      isPublished: true,
      sector: { contains: sectorName, mode: 'insensitive' },
    },
    orderBy: { publishedAt: 'desc' },
    take: 50,
    select: {
      slug: true, symbol: true, companyName: true, sector: true,
      eventType: true, changePercent: true, closePrice: true,
      publishedAt: true, eventDate: true,
    },
  })

  if (stocks.length === 0) notFound()

  const gainers = stocks.filter(s => s.eventType === 'RISE')
  const losers = stocks.filter(s => s.eventType === 'FALL')

  const symbolMap = new Map<string, typeof stocks[0]>()
  for (const s of stocks) {
    if (!symbolMap.has(s.symbol)) symbolMap.set(s.symbol, s)
  }
  const uniqueSymbols = Array.from(symbolMap.values()).slice(0, 20)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <BreadcrumbSchema items={[
        { name: 'Home', url: `${SITE}/` },
        { name: 'Sectors', url: `${SITE}/sectors` },
        { name: sectorName, url: `${SITE}/sectors/${slug}` },
      ]} />

      <nav className="text-xs text-[#666] mb-3" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#1565C0]">Home</Link> ›{' '}
        <span className="text-[#1A1A1A]">Sectors</span> › <span className="text-[#1A1A1A]">{sectorName}</span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-bold mb-2">{sectorName} Sector — Today&apos;s Movers</h1>
      <p className="text-sm text-[#666] mb-6">
        Daily auto-generated explanations of significant stock movements in the {sectorName} sector. Drawn from official NSE/BSE data and verified news sources. Reviewed by the <Link href="/authors/market-desk" className="text-[#1565C0] hover:underline">Markets Desk</Link>.
      </p>

      {gainers.length > 0 && (
        <section className="mb-8">
          <div className="section-header"><span>📈 Recent Gainers</span></div>
          <div className="bg-white border border-t-0 border-[#E0E0E0]">
            {gainers.slice(0, 15).map(s => (
              <Link key={s.slug} href={`/stocks/${s.slug}`} className="flex justify-between items-center p-3 border-b border-[#E0E0E0] last:border-b-0 hover:bg-[#F5F7FA]">
                <div>
                  <div className="font-semibold text-sm">{s.companyName}</div>
                  <div className="text-xs text-[#666]">{s.symbol} • {format(s.publishedAt, 'dd MMM yyyy')}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono-price font-bold">₹{s.closePrice.toFixed(2)}</div>
                  <div className="font-mono-price text-sm font-bold text-rise">▲ +{s.changePercent.toFixed(2)}%</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {losers.length > 0 && (
        <section className="mb-8">
          <div className="section-header"><span>📉 Recent Decliners</span></div>
          <div className="bg-white border border-t-0 border-[#E0E0E0]">
            {losers.slice(0, 15).map(s => (
              <Link key={s.slug} href={`/stocks/${s.slug}`} className="flex justify-between items-center p-3 border-b border-[#E0E0E0] last:border-b-0 hover:bg-[#F5F7FA]">
                <div>
                  <div className="font-semibold text-sm">{s.companyName}</div>
                  <div className="text-xs text-[#666]">{s.symbol} • {format(s.publishedAt, 'dd MMM yyyy')}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono-price font-bold">₹{s.closePrice.toFixed(2)}</div>
                  <div className="font-mono-price text-sm font-bold text-fall">▼ -{s.changePercent.toFixed(2)}%</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <div className="section-header"><span>🏢 Companies in {sectorName}</span></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 bg-white border border-t-0 border-[#E0E0E0]">
          {uniqueSymbols.map(s => (
            <Link key={s.symbol} href={`/stocks/symbol/${s.symbol.toLowerCase()}`} className="p-3 border-r border-b border-[#E0E0E0] hover:bg-[#F5F7FA]">
              <div className="font-semibold text-sm">{s.symbol}</div>
              <div className="text-xs text-[#666] line-clamp-1">{s.companyName}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
