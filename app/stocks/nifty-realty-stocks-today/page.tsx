import type { Metadata } from 'next'
import MoversList from '@/components/seo/MoversList'
import { getSectorMovers } from '@/lib/sectors/moversLib'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Nifty Realty Stocks Today — Live NSE Realty Index | NiftyPulse360',
  description: 'Today’s live performance of Nifty Realty stocks — DLF, Godrej Properties, Oberoi Realty, Prestige, Brigade, Lodha and more. Live price, change %, day range.',
  keywords: ['nifty realty stocks today', 'realty stocks NSE today', 'nifty realty index today', 'Indian real estate stocks', 'DLF Godrej Properties today', 'real estate stocks India'],
  alternates: { canonical: '/stocks/nifty-realty-stocks-today' },
}

export default async function NiftyRealtyStocksPage() {
  const { stocks, fetchedAt } = await getSectorMovers('nifty-realty-stocks-today')

  return (
    <MoversList
      heading="🏠 Nifty Realty Stocks Today"
      intro="Live performance of NSE-listed Indian real-estate developers and realty companies. Sorted by today's biggest movers."
      breadcrumbLabel="Nifty Realty Stocks Today"
      pathname="/stocks/nifty-realty-stocks-today"
      stocks={stocks}
      fetchedAt={fetchedAt}
      tableHeading="Nifty Realty Constituents — Today's Performance"
      emptyMessage="Live realty sector data is being fetched. Please refresh in a moment."
      seoCopy={[
        'The Nifty Realty index represents NSE-listed real estate developers including DLF, Godrej Properties, Oberoi Realty, Prestige Estates, Brigade Enterprises, Phoenix Mills, Lodha (Macrotech) and Sobha. Realty stocks are highly sensitive to interest-rate cycles, RBI policy decisions, residential pre-sales updates, and quarterly project completions.',
        'Use this page to spot moves on RBI announcement days and the first week of each quarter when developers report pre-sales numbers. Data refreshed every hour during market hours.',
      ]}
    />
  )
}
