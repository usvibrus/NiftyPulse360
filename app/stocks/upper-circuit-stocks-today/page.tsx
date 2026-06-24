// SEO: meta optimized
import type { Metadata } from 'next'
import MoversList from '@/components/seo/MoversList'
import { getUpperCircuitStocks } from '@/lib/sectors/moversLib'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Upper Circuit Stocks Today — NSE Stocks Hitting Upper Limit | NiftyPulse360',
  description: 'Live list of NSE stocks hitting upper circuit today (5%, 10%, 20% bands). Updated every hour. Track stocks locked at upper price band with volume and 52-week range.',
  keywords: ['upper circuit stocks today', 'upper circuit NSE today', 'stocks at upper circuit', '20% upper circuit stocks', '10% upper circuit', 'circuit stocks NSE', 'stocks locked upper'],
  alternates: { canonical: '/stocks/upper-circuit-stocks-today' },
}

export default async function UpperCircuitPage() {
  const { stocks, fetchedAt } = await getUpperCircuitStocks()

  return (
    <MoversList
      heading="🔥 Upper Circuit Stocks Today"
      intro="NSE stocks that have hit their upper circuit limit today. Includes 5%, 10% and 20% circuit bands. Sorted by today's biggest gainers."
      breadcrumbLabel="Upper Circuit Stocks Today"
      pathname="/stocks/upper-circuit-stocks-today"
      stocks={stocks}
      fetchedAt={fetchedAt}
      tableHeading="Stocks Hitting Upper Circuit — Today"
      emptyMessage="No stocks have hit upper circuit yet today. Check back during market hours (9:15 AM – 3:30 PM IST)."
      forceRiseStyle
      seoCopy={[
        'A stock hits upper circuit when its price rises by the maximum allowed percentage for the day, after which trading is paused at that price level. NSE assigns daily price bands of 2%, 5%, 10% or 20% to each stock based on its category and recent volatility. When a stock hits upper circuit, only buy orders are accepted — sell orders typically don\'t get matched until the next trading session opens.',
        'Stocks repeatedly hitting upper circuit usually have strong news triggers: order wins, regulatory approvals, results beats, takeover rumours, or technical breakouts. Day traders watch this list every morning to spot momentum candidates. Note that liquid Nifty 50 / Nifty Next 50 stocks typically have wider bands (10–20%), while small-caps may have tighter 5% bands.',
        'This page lists stocks from our curated NSE universe that are up 4.5% or more — a fuzzy threshold that captures most upper-circuit names while filtering out borderline cases. Refreshed every hour.',
      ]}
    />
  )
}
