// EV stocks filter verified
import type { Metadata } from 'next'
import MoversList from '@/components/seo/MoversList'
import { getSectorMovers } from '@/lib/sectors/moversLib'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Nifty EV Stocks Today — Live NSE EV & New-Energy Stocks | NiftyPulse360',
  description: 'Today’s live performance of Indian EV and new-energy stocks — Tata Motors, M&M, TVS Motor, Olectra, Exide, Tata Power, Adani Green and more. Live price and change %.',
  keywords: ['nifty EV stocks today', 'electric vehicle stocks NSE', 'EV stocks India today', 'Tata Motors Olectra today', 'new energy stocks India', 'EV battery stocks today'],
  alternates: { canonical: '/stocks/nifty-ev-stocks-today' },
}

export default async function NiftyEVStocksPage() {
  const { stocks, fetchedAt } = await getSectorMovers('nifty-ev-stocks-today')

  return (
    <MoversList
      heading="⚡ Nifty EV & New-Energy Stocks Today"
      intro="Live performance of NSE-listed Indian electric-vehicle, battery and clean-energy companies. Sorted by today's biggest movers."
      breadcrumbLabel="Nifty EV Stocks Today"
      pathname="/stocks/nifty-ev-stocks-today"
      stocks={stocks}
      fetchedAt={fetchedAt}
      tableHeading="EV & New-Energy Stocks — Today's Performance"
      emptyMessage="Live EV sector data is being fetched. Please refresh in a moment."
      seoCopy={[
        'India\'s EV and new-energy theme spans automakers (Tata Motors, M&M, TVS Motor, Bajaj Auto, Olectra Greentech), battery and energy-storage companies (Exide Industries, Amara Raja, IEX), and renewable-power generators (Tata Power, Adani Green, Suzlon, Inox Wind). The theme is driven by FAME-II subsidies, PLI announcements, monthly EV registration data, and global lithium / battery raw-material prices.',
        'This curated list groups the most-traded NSE names linked to India\'s EV and clean-energy transition into one daily dashboard. Data refreshed every hour during market hours.',
      ]}
    />
  )
}
