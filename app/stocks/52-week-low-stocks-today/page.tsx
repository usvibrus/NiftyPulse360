// SEO: meta optimized
import type { Metadata } from 'next'
import MoversList from '@/components/seo/MoversList'
import { get52WeekLowStocks } from '@/lib/sectors/moversLib'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '52-Week Low Stocks Today — NSE Stocks at Yearly Low | NiftyPulse360',
  description: 'Live list of NSE stocks hitting 52-week low today. Updated every hour. Track stocks at fresh yearly lows with price, change %, day range and volume.',
  keywords: ['52 week low stocks today', '52 week low NSE', 'stocks at 52 week low', 'yearly low stocks NSE', 'beaten down stocks NSE', 'fresh 52w low', 'stocks at year low'],
  alternates: { canonical: '/stocks/52-week-low-stocks-today' },
}

export default async function FiftyTwoWeekLowPage() {
  const { stocks, fetchedAt } = await get52WeekLowStocks()

  return (
    <MoversList
      heading="📉 Stocks at 52-Week Low Today"
      intro="NSE stocks trading within 1% of their 52-week low. Beaten-down names, potential value picks, and stocks in strong downtrends."
      breadcrumbLabel="52-Week Low Stocks Today"
      pathname="/stocks/52-week-low-stocks-today"
      stocks={stocks}
      fetchedAt={fetchedAt}
      tableHeading="Stocks Near or At 52-Week Low"
      emptyMessage="No stocks are at 52-week low right now. Check back during market hours."
      seoCopy={[
        'A 52-week low is the lowest price a stock has touched in the last one year of trading. Stocks repeatedly making new 52-week lows are typically in strong downtrends — value investors watch this list to identify potential bargains, while momentum traders avoid these names entirely until a clear reversal forms.',
        'Not every 52-week low is a buying opportunity. Many stocks at fresh lows are there for fundamental reasons: declining earnings, governance issues, sector decline, or competitive disruption. Always check the news flow and quarterly results before considering names from this list. A useful filter: stocks at 52-week lows on shrinking volume often see relief rallies; those at lows on rising volume tend to keep falling.',
        'This page lists stocks within 1% of their 52-week low from our curated NSE universe. Refreshed every hour during market hours.',
      ]}
    />
  )
}
