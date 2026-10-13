import type { Metadata } from 'next'
import MoversList from '@/components/seo/MoversList'
import { get52WeekHighStocks } from '@/lib/sectors/moversLib'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '52-Week High Stocks Today — NSE Stocks at Yearly High | NiftyPulse360',
  description: 'Live list of NSE stocks hitting 52-week high today. Updated every hour. Track stocks at fresh yearly highs with price, change %, day range and volume.',
  keywords: ['52 week high stocks today', '52 week high NSE', 'stocks at 52 week high', 'all time high stocks NSE', 'breakout stocks today', 'yearly high stocks India', 'fresh 52w high'],
  alternates: { canonical: '/stocks/52-week-high-stocks-today' },
}

export default async function FiftyTwoWeekHighPage() {
  const { stocks, fetchedAt } = await get52WeekHighStocks()

  return (
    <MoversList
      heading="🎯 Stocks at 52-Week High Today"
      intro="NSE stocks trading within 1% of their 52-week high. Fresh breakouts, momentum candidates and trend-followers' favourites."
      breadcrumbLabel="52-Week High Stocks Today"
      pathname="/stocks/52-week-high-stocks-today"
      stocks={stocks}
      fetchedAt={fetchedAt}
      tableHeading="Stocks Near or At 52-Week High"
      emptyMessage="No stocks are at 52-week high right now. Check back during market hours."
      seoCopy={[
        'A 52-week high is the highest price a stock has reached in the last one year of trading. Stocks consistently making new 52-week highs are typically in strong uptrends and are favoured by momentum and trend-following traders. The "rule of strength" in technical analysis says: stocks at fresh highs tend to keep going higher in the short-to-medium term.',
        'Watch this list daily during bull-market phases — sectoral rotations show up here first. A stock breaking out to a fresh 52-week high on heavy volume is often the start of a sustained move. Conversely, a 52-week-high candidate reversing sharply on the day is a classic exhaustion signal.',
        'This page lists stocks within 1% of their 52-week high from our curated NSE universe. Refreshed every hour during market hours.',
      ]}
    />
  )
}
