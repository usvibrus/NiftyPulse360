import type { Metadata } from 'next'
import MoversList from '@/components/seo/MoversList'
import { getSectorMovers } from '@/lib/sectors/moversLib'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Nifty Auto Stocks Today — Live NSE Auto Index Performance | NiftyPulse360',
  description: 'Today’s live performance of Nifty Auto stocks — Maruti, Tata Motors, M&M, Bajaj Auto, Hero MotoCorp, TVS Motor and more. Live price, change %, day range.',
  keywords: ['nifty auto stocks today', 'auto stocks NSE today', 'nifty auto index today', 'Indian auto sector stocks', 'Maruti Tata Motors today', 'two-wheeler stocks today'],
  alternates: { canonical: '/stocks/nifty-auto-stocks-today' },
}

export default async function NiftyAutoStocksPage() {
  const { stocks, fetchedAt } = await getSectorMovers('nifty-auto-stocks-today')

  return (
    <MoversList
      heading="🚗 Nifty Auto Stocks Today"
      intro="Live performance of NSE-listed Indian automobile, two-wheeler and auto-component companies. Sorted by today's biggest movers."
      breadcrumbLabel="Nifty Auto Stocks Today"
      pathname="/stocks/nifty-auto-stocks-today"
      stocks={stocks}
      fetchedAt={fetchedAt}
      tableHeading="Nifty Auto Constituents — Today's Performance"
      emptyMessage="Live auto sector data is being fetched. Please refresh in a moment."
      seoCopy={[
        'The Nifty Auto index covers India\'s largest passenger-vehicle, two-wheeler, commercial-vehicle and auto-component manufacturers — Maruti Suzuki, Tata Motors, Mahindra & Mahindra, Bajaj Auto, Eicher Motors, Hero MotoCorp, TVS Motor, Ashok Leyland, Bosch, Motherson Sumi and MRF. The sector is driven by monthly volume data, festive demand, fuel prices, EV transitions and rural sentiment.',
        'Watch this page during the first week of every month when companies report their monthly sales numbers — that\'s the biggest single trigger for moves in this sector. Data refreshed every hour.',
      ]}
    />
  )
}
