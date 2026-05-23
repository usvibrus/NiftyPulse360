import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Market Data Desk — Author Profile',
  description: 'The Markets Desk at NiftyPulse360: methodology, coverage areas, and recent published analyses.',
  alternates: { canonical: '/authors/market-desk' },
}

export default async function MarketDeskPage() {
  const recent = await prisma.stockEvent.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    take: 12,
    select: { slug: true, metaTitle: true, publishedAt: true, symbol: true, eventType: true, changePercent: true },
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Market Data Desk',
    url: `${siteUrl}/authors/market-desk`,
    jobTitle: 'Markets Editorial Desk',
    description: 'The Markets Desk at NiftyPulse360 publishes daily explanations of significant Indian stock, index, commodity, and currency movements.',
    knowsAbout: ['Indian Stock Market', 'NSE', 'BSE', 'Equity Analysis', 'Commodity Markets', 'Currency Markets'],
    worksFor: { '@type': 'Organization', name: 'NiftyPulse360', url: siteUrl },
    sameAs: [
      'https://x.com/bhamre61968',
      'https://www.linkedin.com/in/ankit-bhamre-a82b58343/',
    ],
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />

      <nav className="text-xs text-[#666] mb-3" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#1565C0]">Home</Link> › <span className="text-[#1A1A1A]">Authors</span> › <span className="text-[#1A1A1A]">Market Data Desk</span>
      </nav>

      <div className="prose">
        <h1>Market Data Desk</h1>
        <p className="text-base text-[#666]"><em>Editorial Desk &mdash; NiftyPulse360</em></p>

        <h2>About the Desk</h2>
        <p>The Markets Desk at NiftyPulse360 is responsible for the daily catalogue of &quot;why did this move&quot; explanations covering significant Indian equity, index, commodity, and currency movements. The desk operates a data-first workflow: significant moves are detected from official exchange data, news for each mover is retrieved from major Indian and global financial publishers, and the explanation is drafted under strict factual constraints, citing only the source data. Drafts are sampled and reviewed each day by the editorial team.</p>

        <h2>Coverage Areas</h2>
        <ul>
          <li>Indian equities listed on NSE and BSE (Nifty 200 universe).</li>
          <li>Major indices: Nifty 50, Sensex, Bank Nifty, sectoral indices, India VIX.</li>
          <li>Precious metals: Gold (24K, 22K), Silver in Indian rupees per gram.</li>
          <li>Commodities: Crude Oil, Natural Gas, Copper.</li>
          <li>Currencies: USD/INR, EUR/INR, GBP/INR, JPY/INR.</li>
        </ul>

        <h2>Editorial Approach</h2>
        <ul>
          <li><strong>Data first.</strong> Every page is grounded in official price and volume data.</li>
          <li><strong>News-cited.</strong> Every &quot;why&quot; claim cites at least one named publisher from the last 48 hours.</li>
          <li><strong>No recommendations.</strong> NiftyPulse360 is not SEBI-registered and provides no buy, sell, or hold guidance.</li>
          <li><strong>Transparency.</strong> Source data and methodology are disclosed on every page.</li>
        </ul>
        <p>Read more in our <Link href="/methodology">Methodology</Link> and <Link href="/editorial-guidelines">Editorial Guidelines</Link>.</p>

        <h2>Contact</h2>
        <p>Editorial: <a href="mailto:editor@niftypulse360.com">editor@niftypulse360.com</a><br/>
        Corrections: <a href="mailto:corrections@niftypulse360.com">corrections@niftypulse360.com</a></p>
      </div>

      <div className="mt-10">
        <div className="section-header"><span>Recent Articles by the Desk</span></div>
        <div className="bg-white border border-t-0 border-[#E0E0E0]">
          {recent.map(r => (
            <Link key={r.slug} href={`/stocks/${r.slug}`} className="block p-3 border-b border-[#E0E0E0] last:border-b-0 hover:bg-[#F5F7FA]">
              <div className="text-sm font-semibold text-[#1A1A1A] hover:text-[#1565C0]">{r.metaTitle}</div>
              <div className="text-xs text-[#666] mt-1">
                {format(r.publishedAt, 'dd MMM yyyy, h:mm a')} IST &middot; {r.symbol} &middot; {r.eventType === 'RISE' ? '▲' : '▼'} {r.changePercent.toFixed(2)}%
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
