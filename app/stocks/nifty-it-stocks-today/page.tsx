import type { Metadata } from 'next'
import MoversList from '@/components/seo/MoversList'
import { getSectorMovers } from '@/lib/sectors/moversLib'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Nifty IT Stocks Today — Live NSE IT Index Performance | NiftyPulse360',
  description: 'Today’s live performance of Nifty IT stocks on NSE — TCS, Infosys, Wipro, HCL Tech, Tech Mahindra and more. Updated every hour with price, change %, day range and 52-week range.',
  keywords: ['nifty IT stocks today', 'IT stocks NSE today', 'nifty IT index today', 'TCS Infosys Wipro today', 'Indian IT sector stocks'],
  alternates: { canonical: '/stocks/nifty-it-stocks-today' },
}

export default async function NiftyITStocksPage() {
  const { stocks, fetchedAt } = await getSectorMovers('nifty-it-stocks-today')

  return (
    <MoversList
      heading="🖥️ Nifty IT Stocks Today"
      intro="Live performance of NSE-listed Indian IT services and software companies. Sorted by today's biggest movers."
      breadcrumbLabel="Nifty IT Stocks Today"
      pathname="/stocks/nifty-it-stocks-today"
      stocks={stocks}
      fetchedAt={fetchedAt}
      tableHeading="Nifty IT Constituents — Today's Performance"
      emptyMessage="Live IT sector data is being fetched. Please refresh in a moment."
      seoCopy={[
        'The Nifty IT index tracks the top NSE-listed Indian information technology and services companies including TCS, Infosys, HCL Technologies, Wipro, Tech Mahindra, LTIMindtree, Persistent Systems and Mphasis. These companies primarily earn revenue in US dollars and Euros, making the IT sector sensitive to USD-INR movements and global tech spending trends.',
        'Use this page every morning to spot which IT stocks are leading or lagging the broader index. Click any company name to see detailed daily analysis, news triggers, and 52-week context. Data is sourced live from public market feeds and refreshed every hour during market hours.',
      ]}
    />
  )
}
