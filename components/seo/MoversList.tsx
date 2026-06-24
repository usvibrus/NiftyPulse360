// Component reviewed
import Link from 'next/link'
import { format } from 'date-fns'
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema'
import { GoogleFinanceStock } from '@/lib/services/googleFinanceService'

interface MoversListProps {
  /** SEO H1 title */
  heading: string
  /** Page intro paragraph */
  intro: string
  /** Breadcrumb label for the current page */
  breadcrumbLabel: string
  /** URL path of the current page (e.g. /stocks/upper-circuit-stocks-today) */
  pathname: string
  /** Fetched & filtered stock list */
  stocks: GoogleFinanceStock[]
  /** Server timestamp when data was fetched */
  fetchedAt: Date
  /** Empty-state message shown when stocks.length === 0 */
  emptyMessage: string
  /** Optional SEO long-form copy paragraph(s) */
  seoCopy?: string[]
  /** Optional H2 heading above the table */
  tableHeading?: string
  /** Show the % change column with green ▲ even for negative? Default false */
  forceRiseStyle?: boolean
  /** Show the % change column with red ▼ even for positive? Default false */
  forceFallStyle?: boolean
}

export default function MoversList({
  heading,
  intro,
  breadcrumbLabel,
  pathname,
  stocks,
  fetchedAt,
  emptyMessage,
  seoCopy = [],
  tableHeading = 'Live List — Sorted by Performance',
  forceRiseStyle = false,
  forceFallStyle = false,
}: MoversListProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <BreadcrumbSchema items={[
        { name: 'Home', url: `${siteUrl}/` },
        { name: 'Stocks', url: `${siteUrl}/stocks` },
        { name: breadcrumbLabel, url: `${siteUrl}${pathname}` },
      ]} />

      <nav className="text-xs text-[#666] mb-3">
        <Link href="/" className="hover:text-[#1565C0]">Home</Link> ›{' '}
        <Link href="/stocks" className="hover:text-[#1565C0]">Stocks</Link> ›{' '}
        <span className="text-[#1A1A1A]">{breadcrumbLabel}</span>
      </nav>

      <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] mb-2">{heading}</h1>
      <p className="text-sm text-[#666] mb-1">{intro}</p>
      <p className="text-xs text-[#888] mb-4">
        Last updated: {format(fetchedAt, 'dd MMM yyyy, h:mm a')} IST
      </p>

      <div className="bg-white border border-[#E0E0E0] rounded mb-6">
        <div className="section-header"><span>{tableHeading}</span></div>
        {stocks.length === 0 ? (
          <p className="p-6 text-center text-[#666]">{emptyMessage}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F7FA] text-xs text-[#666] uppercase">
                <th className="text-left p-2 pl-4 w-10">#</th>
                <th className="text-left p-2">Company</th>
                <th className="text-right p-2">Price</th>
                <th className="text-right p-2">Change %</th>
                <th className="text-right p-2 hidden md:table-cell">Day Range</th>
                <th className="text-right p-2 pr-4 hidden md:table-cell">52-Wk Range</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s, i) => {
                const isUp = forceRiseStyle ? true : forceFallStyle ? false : s.changePercent >= 0
                return (
                  <tr key={s.symbol} className="border-t border-[#E0E0E0] hover:bg-[#F5F7FA]">
                    <td className="p-2 pl-4 text-[#666]">{i + 1}</td>
                    <td className="p-2">
                      <Link href={`/stocks/symbol/${s.symbol}`} className="font-semibold text-[#1A1A1A] hover:text-[#1565C0]">
                        {s.companyName}
                      </Link>
                      <div className="text-xs text-[#666]">{s.symbol}</div>
                    </td>
                    <td className="text-right p-2 font-mono-price">₹{s.price.toFixed(2)}</td>
                    <td className={`text-right p-2 font-bold ${isUp ? 'text-rise' : 'text-fall'}`}>
                      {isUp ? '▲' : '▼'} {Math.abs(s.changePercent).toFixed(2)}%
                    </td>
                    <td className="text-right p-2 text-xs text-[#666] hidden md:table-cell">
                      {s.dayLow > 0 && s.dayHigh > 0 ? `₹${s.dayLow.toFixed(0)}–₹${s.dayHigh.toFixed(0)}` : '-'}
                    </td>
                    <td className="text-right p-2 pr-4 text-xs text-[#666] hidden md:table-cell">
                      {s.yearLow > 0 && s.yearHigh > 0 ? `₹${s.yearLow.toFixed(0)}–₹${s.yearHigh.toFixed(0)}` : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Internal links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-6">
        <Link href="/stocks/top-gainers-today" className="bg-white border border-[#E0E0E0] rounded p-3 hover:border-[#1565C0]">
          <div className="font-semibold text-[#1A1A1A]">📈 Top Gainers</div>
          <div className="text-xs text-[#666] mt-1">Today&apos;s biggest winners</div>
        </Link>
        <Link href="/stocks/top-losers-today" className="bg-white border border-[#E0E0E0] rounded p-3 hover:border-[#1565C0]">
          <div className="font-semibold text-[#1A1A1A]">📉 Top Losers</div>
          <div className="text-xs text-[#666] mt-1">Today&apos;s biggest decliners</div>
        </Link>
        <Link href="/stocks/upper-circuit-stocks-today" className="bg-white border border-[#E0E0E0] rounded p-3 hover:border-[#1565C0]">
          <div className="font-semibold text-[#1A1A1A]">🔥 Upper Circuit</div>
          <div className="text-xs text-[#666] mt-1">Stocks at upper limit</div>
        </Link>
        <Link href="/stocks/52-week-high-stocks-today" className="bg-white border border-[#E0E0E0] rounded p-3 hover:border-[#1565C0]">
          <div className="font-semibold text-[#1A1A1A]">🎯 52-Week High</div>
          <div className="text-xs text-[#666] mt-1">New yearly highs</div>
        </Link>
      </div>

      {/* SEO content */}
      {seoCopy.length > 0 && (
        <section className="bg-white border border-[#E0E0E0] rounded p-5 mb-6">
          <h2 className="text-lg font-bold mb-3">About This List</h2>
          {seoCopy.map((p, i) => (
            <p key={i} className="text-sm text-[#444] mb-3 leading-relaxed">{p}</p>
          ))}
          <p className="text-xs text-[#666] italic">
            Disclaimer: NiftyPulse360 is not a SEBI-registered investment advisor. Information here is for educational purposes only.
          </p>
        </section>
      )}
    </div>
  )
}
