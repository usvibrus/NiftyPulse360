// SEO: meta optimized
import type { Metadata } from 'next'
import MoversList from '@/components/seo/MoversList'
import { getSectorMovers } from '@/lib/sectors/moversLib'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Nifty Pharma Stocks Today — Live NSE Pharma Index | NiftyPulse360',
  description: 'Today’s live performance of Nifty Pharma stocks — Sun Pharma, Cipla, Dr Reddy’s, Divis Lab, Lupin and more. Live price, change %, day range and 52-week range.',
  keywords: ['nifty pharma stocks today', 'pharma stocks NSE today', 'nifty pharma index today', 'Indian pharma sector stocks', 'Sun Pharma Cipla Dr Reddy today'],
  alternates: { canonical: '/stocks/nifty-pharma-stocks-today' },
}

export default async function NiftyPharmaStocksPage() {
  const { stocks, fetchedAt } = await getSectorMovers('nifty-pharma-stocks-today')

  return (
    <MoversList
      heading="💊 Nifty Pharma Stocks Today"
      intro="Live performance of NSE-listed Indian pharmaceutical and healthcare companies. Sorted by today's biggest movers."
      breadcrumbLabel="Nifty Pharma Stocks Today"
      pathname="/stocks/nifty-pharma-stocks-today"
      stocks={stocks}
      fetchedAt={fetchedAt}
      tableHeading="Nifty Pharma Constituents — Today's Performance"
      emptyMessage="Live pharma sector data is being fetched. Please refresh in a moment."
      seoCopy={[
        'The Nifty Pharma index tracks the top NSE-listed Indian pharmaceutical and healthcare companies including Sun Pharma, Cipla, Dr Reddy\'s Laboratories, Divis Labs, Apollo Hospitals, Lupin, Torrent Pharma and Aurobindo Pharma. The sector is influenced by US FDA approvals, generic-drug pricing, regulatory inspections, and quarterly results.',
        'Use this page every morning to monitor which pharma names are leading. Click any company to see detailed daily analysis, news triggers, and 52-week context. Data is sourced live from public market feeds and refreshed every hour.',
      ]}
    />
  )
}
