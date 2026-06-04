import type { Metadata } from 'next'
import MoversList from '@/components/seo/MoversList'
import { getLowerCircuitStocks } from '@/lib/sectors/moversLib'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Lower Circuit Stocks Today — NSE Stocks Hitting Lower Limit | NiftyPulse360',
  description: 'Live list of NSE stocks hitting lower circuit today (5%, 10%, 20% bands). Updated every hour. Track stocks locked at lower price band with volume and 52-week range.',
  keywords: ['lower circuit stocks today', 'lower circuit NSE today', 'stocks at lower circuit', '20% lower circuit stocks', '10% lower circuit', 'circuit stocks NSE', 'stocks locked lower'],
  alternates: { canonical: '/stocks/lower-circuit-stocks-today' },
}

export default async function LowerCircuitPage() {
  const { stocks, fetchedAt } = await getLowerCircuitStocks()

  return (
    <MoversList
      heading="🧊 Lower Circuit Stocks Today"
      intro="NSE stocks that have hit their lower circuit limit today. Includes 5%, 10% and 20% circuit bands. Sorted by today's biggest losers."
      breadcrumbLabel="Lower Circuit Stocks Today"
      pathname="/stocks/lower-circuit-stocks-today"
      stocks={stocks}
      fetchedAt={fetchedAt}
      tableHeading="Stocks Hitting Lower Circuit — Today"
      emptyMessage="No stocks have hit lower circuit yet today. Check back during market hours (9:15 AM – 3:30 PM IST)."
      forceFallStyle
      seoCopy={[
        'A stock hits lower circuit when its price falls by the maximum allowed percentage for the day, after which trading is paused at that price level. NSE assigns daily price bands of 2%, 5%, 10% or 20% to each stock. When a stock hits lower circuit, only sell orders are accepted — buy orders typically don\'t get matched until the next trading session.',
        'Stocks hitting lower circuit usually have negative triggers: weak quarterly results, regulatory action, governance concerns, promoter pledge issues, sectoral headwinds or unexpected losses. Repeated lower-circuit hits across multiple sessions is a strong red flag — investors often get stuck unable to exit. Most retail-favourite small-caps and micro-caps have 5% or 10% bands.',
        'This page lists stocks from our curated NSE universe that are down 4.5% or more — a fuzzy threshold that captures most lower-circuit names. Refreshed every hour.',
      ]}
    />
  )
}
