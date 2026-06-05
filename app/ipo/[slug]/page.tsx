import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'
import FAQSchema from '@/components/seo/FAQSchema'
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const ipo = await prisma.ipoEvent.findUnique({
    where: { slug },
    select: { metaTitle: true, metaDesc: true, slug: true, companyName: true, keywords: true, publishedAt: true, updatedAt: true, gmpValue: true, status: true },
  })
  if (!ipo) return { title: 'IPO Not Found' }

  return {
    title: ipo.metaTitle,
    description: ipo.metaDesc,
    alternates: { canonical: `/ipo/${ipo.slug}` },
    keywords: ipo.keywords,
    openGraph: {
      title: ipo.metaTitle,
      description: ipo.metaDesc,
      type: 'article',
      url: `${SITE}/ipo/${ipo.slug}`,
      siteName: 'NiftyPulse360',
      publishedTime: ipo.publishedAt.toISOString(),
      modifiedTime: ipo.updatedAt.toISOString(),
    },
    twitter: { card: 'summary_large_image', title: ipo.metaTitle, description: ipo.metaDesc },
  }
}

export default async function IpoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ipo = await prisma.ipoEvent.findUnique({ where: { slug } })
  if (!ipo) notFound()

  const faqItems = (ipo.faqContent as { question: string; answer: string }[]) || []
  const subscriptionData = ipo.subscriptionData as { retail?: number; hni?: number; qib?: number; total?: number } | null
  const financials = ipo.financials as { year: string; revenue: number; pat: number; netWorth: number }[] | null

  const statusBadge = {
    UPCOMING: { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' },
    OPEN: { label: 'Open Now', color: 'bg-green-100 text-green-700' },
    CLOSED: { label: 'Closed', color: 'bg-yellow-100 text-yellow-700' },
    ALLOTMENT: { label: 'Allotment', color: 'bg-purple-100 text-purple-700' },
    LISTED: { label: 'Listed', color: 'bg-gray-100 text-gray-700' },
  }[ipo.status] || { label: ipo.status, color: 'bg-gray-100 text-gray-700' }

  return (
    <>
      <BreadcrumbSchema items={[
        { name: 'Home', url: SITE },
        { name: 'IPO', url: `${SITE}/ipo` },
        { name: `${ipo.companyName} IPO`, url: `${SITE}/ipo/${slug}` },
      ]} />
      {faqItems.length > 0 && <FAQSchema items={faqItems} />}

      <article className="max-w-4xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#666] mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#1565C0]">Home</Link>
          <span className="text-[#ccc]">/</span>
          <Link href="/ipo" className="hover:text-[#1565C0]">IPO</Link>
          <span className="text-[#ccc]">/</span>
          <span className="text-[#1A1A1A] font-medium truncate max-w-[250px]">{ipo.companyName}</span>
        </nav>

        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-0.5 text-xs font-bold rounded ${statusBadge.color}`}>{statusBadge.label}</span>
            <span className="text-xs text-[#666]">{ipo.ipoType} · {ipo.exchange}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-2">
            {ipo.companyName} IPO {ipo.gmpValue !== null ? `— GMP ₹${ipo.gmpValue}` : ''}
          </h1>
          <p className="text-sm text-[#666]">
            {ipo.metaDesc}
          </p>
        </header>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-[#E0E0E0] rounded p-3">
            <div className="text-xs text-[#666]">Price Band</div>
            <div className="font-bold text-[#1A1A1A]">{ipo.priceBandMin && ipo.priceBandMax ? `₹${ipo.priceBandMin} - ₹${ipo.priceBandMax}` : 'TBA'}</div>
          </div>
          <div className="bg-white border border-[#E0E0E0] rounded p-3">
            <div className="text-xs text-[#666]">Lot Size</div>
            <div className="font-bold text-[#1A1A1A]">{ipo.lotSize ? `${ipo.lotSize} shares` : 'TBA'}</div>
          </div>
          <div className="bg-white border border-[#E0E0E0] rounded p-3">
            <div className="text-xs text-[#666]">Issue Size</div>
            <div className="font-bold text-[#1A1A1A]">{ipo.issueSizeCr ? `₹${ipo.issueSizeCr.toFixed(0)} Cr` : 'TBA'}</div>
          </div>
          <div className="bg-white border border-[#E0E0E0] rounded p-3">
            <div className="text-xs text-[#666]">GMP Today</div>
            <div className={`font-bold ${ipo.gmpValue !== null && ipo.gmpValue >= 0 ? 'text-rise' : 'text-fall'}`}>
              {ipo.gmpValue !== null ? `${ipo.gmpValue >= 0 ? '+' : ''}₹${ipo.gmpValue}` : '—'}
            </div>
          </div>
        </div>

        {/* IPO Dates */}
        <div className="bg-white border border-[#E0E0E0] rounded p-4 mb-6">
          <h2 className="font-bold text-[#1A1A1A] mb-3">IPO Timeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-[#666]">Opens</div>
              <div className="font-semibold">{ipo.openDate ? format(ipo.openDate, 'dd MMM yyyy') : 'TBA'}</div>
            </div>
            <div>
              <div className="text-xs text-[#666]">Closes</div>
              <div className="font-semibold">{ipo.closeDate ? format(ipo.closeDate, 'dd MMM yyyy') : 'TBA'}</div>
            </div>
            <div>
              <div className="text-xs text-[#666]">Allotment</div>
              <div className="font-semibold">{ipo.allotmentDate ? format(ipo.allotmentDate, 'dd MMM yyyy') : 'TBA'}</div>
            </div>
            <div>
              <div className="text-xs text-[#666]">Listing</div>
              <div className="font-semibold">{ipo.listingDate ? format(ipo.listingDate, 'dd MMM yyyy') : 'TBA'}</div>
            </div>
          </div>
        </div>

        {/* GMP Section */}
        {ipo.gmpValue !== null && (
          <div className="bg-white border border-[#E0E0E0] rounded p-4 mb-6">
            <h2 className="font-bold text-[#1A1A1A] mb-3">{ipo.companyName} IPO GMP Today</h2>
            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
              <div>
                <div className="text-xs text-[#666]">Issue Price</div>
                <div className="font-bold">₹{ipo.priceBandMax || ipo.issuePrice || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-[#666]">GMP</div>
                <div className={`font-bold ${ipo.gmpValue >= 0 ? 'text-rise' : 'text-fall'}`}>
                  {ipo.gmpValue >= 0 ? '+' : ''}₹{ipo.gmpValue}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#666]">Expected Listing</div>
                <div className="font-bold">
                  ₹{((ipo.priceBandMax || ipo.issuePrice || 0) + ipo.gmpValue).toFixed(0)}
                </div>
              </div>
            </div>
            <p className="text-xs text-[#999]">GMP is unofficial and based on grey market activity. Actual listing price may differ.</p>
          </div>
        )}

        {/* Subscription */}
        {subscriptionData && subscriptionData.total && subscriptionData.total > 0 && (
          <div className="bg-white border border-[#E0E0E0] rounded p-4 mb-6">
            <h2 className="font-bold text-[#1A1A1A] mb-3">{ipo.companyName} IPO Subscription Status</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F7FA] text-xs text-[#666]">
                  <th className="text-left p-2">Category</th>
                  <th className="text-right p-2">Subscription</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionData.retail !== undefined && <tr className="border-t border-[#E0E0E0]"><td className="p-2">Retail</td><td className="text-right p-2 font-bold">{subscriptionData.retail.toFixed(2)}x</td></tr>}
                {subscriptionData.hni !== undefined && <tr className="border-t border-[#E0E0E0]"><td className="p-2">HNI / NII</td><td className="text-right p-2 font-bold">{subscriptionData.hni.toFixed(2)}x</td></tr>}
                {subscriptionData.qib !== undefined && <tr className="border-t border-[#E0E0E0]"><td className="p-2">QIB</td><td className="text-right p-2 font-bold">{subscriptionData.qib.toFixed(2)}x</td></tr>}
                <tr className="border-t border-[#E0E0E0] bg-[#F5F7FA]"><td className="p-2 font-bold">Total</td><td className="text-right p-2 font-bold">{subscriptionData.total.toFixed(2)}x</td></tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Listing Result (if listed) */}
        {ipo.status === 'LISTED' && ipo.listingPrice && (
          <div className="bg-white border border-[#E0E0E0] rounded p-4 mb-6">
            <h2 className="font-bold text-[#1A1A1A] mb-3">{ipo.companyName} IPO Listing Result</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-xs text-[#666]">Issue Price</div>
                <div className="font-bold">₹{ipo.issuePrice || ipo.priceBandMax}</div>
              </div>
              <div>
                <div className="text-xs text-[#666]">Listing Price</div>
                <div className="font-bold">₹{ipo.listingPrice}</div>
              </div>
              <div>
                <div className="text-xs text-[#666]">Gain/Loss</div>
                <div className={`font-bold ${(ipo.listingGainLoss || 0) >= 0 ? 'text-rise' : 'text-fall'}`}>
                  {(ipo.listingGainLoss || 0) >= 0 ? '+' : ''}{ipo.listingGainLoss?.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-[#666]">Day Close</div>
                <div className="font-bold">{ipo.listingDayClose ? `₹${ipo.listingDayClose}` : '—'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Page Content (AI generated) */}
        {ipo.pageContent && (
          <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: ipo.pageContent }} />
        )}

        {/* Allotment Check Button */}
        {ipo.registrarName && ipo.registrarUrl && (
          <div className="bg-[#F0F7FF] border border-[#1565C0]/20 rounded p-5 mb-6 text-center">
            <h2 className="font-bold text-[#1A1A1A] mb-2">Check {ipo.companyName} IPO Allotment Status</h2>
            <p className="text-sm text-[#666] mb-3">Check your allotment on {ipo.registrarName} using PAN, Application Number, or Demat ID.</p>
            <a
              href={ipo.registrarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#1565C0] text-white px-6 py-2.5 rounded font-semibold text-sm hover:bg-[#0D47A1] transition-colors"
            >
              Check Allotment Status →
            </a>
          </div>
        )}

        {/* FAQ */}
        {faqItems.length > 0 && (
          <div className="bg-white border border-[#E0E0E0] rounded p-4 mb-6">
            <h2 className="font-bold text-[#1A1A1A] mb-4">{ipo.companyName} IPO FAQs</h2>
            <div className="space-y-4">
              {faqItems.map((faq, i) => (
                <div key={i} className="border-b border-[#E0E0E0] pb-3 last:border-b-0">
                  <h3 className="font-semibold text-sm text-[#1A1A1A] mb-1">{faq.question}</h3>
                  <p className="text-sm text-[#666]">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back */}
        <div className="mt-8">
          <Link href="/ipo" className="text-sm font-semibold text-[#1565C0] hover:text-[#0D47A1]">← Back to All IPOs</Link>
        </div>
      </article>
    </>
  )
}
