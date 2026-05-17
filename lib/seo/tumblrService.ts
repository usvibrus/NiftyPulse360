import tumblr from 'tumblr.js'
import { prisma } from '@/lib/db/prisma'

function getClient() {
  const { TUMBLR_CONSUMER_KEY, TUMBLR_CONSUMER_SECRET, TUMBLR_TOKEN, TUMBLR_TOKEN_SECRET } = process.env
  if (!TUMBLR_CONSUMER_KEY || !TUMBLR_TOKEN) return null
  return tumblr.createClient({
    consumer_key: TUMBLR_CONSUMER_KEY,
    consumer_secret: TUMBLR_CONSUMER_SECRET!,
    token: TUMBLR_TOKEN,
    token_secret: TUMBLR_TOKEN_SECRET!,
  })
}

export async function postToTumblr() {
  const client = getClient()
  if (!client) { console.log('[tumblr] No credentials configured'); return { posted: 0 } }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  let posted = 0

  const stocks = await prisma.stockEvent.findMany({
    where: { tumblrPosted: false, isPublished: true },
    take: 2,
    orderBy: { changePercent: 'desc' },
  })

  for (const s of stocks) {
    const verb = s.eventType === 'RISE' ? 'surged' : 'dropped'
    const emoji = s.eventType === 'RISE' ? '📈' : '📉'

    const body = `<h2>${emoji} ${s.companyName} (${s.symbol}) ${verb} ${Math.abs(s.changePercent).toFixed(1)}% Today</h2>
<ul>
<li>Open: ₹${s.openPrice.toFixed(2)} | Close: ₹${s.closePrice.toFixed(2)}</li>
<li>High: ₹${s.highPrice.toFixed(2)} | Low: ₹${s.lowPrice.toFixed(2)}</li>
<li>Change: ${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(2)}%</li>
</ul>
<p>${s.aiAnalysis ? s.aiAnalysis.slice(0, 500) : ''}</p>
<p><a href="${siteUrl}/stocks/${s.slug}">Read full analysis on NiftyPulse360</a></p>`

    try {
      await new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (client as any).createPost('niftypulse360', {
          type: 'text',
          title: `${s.companyName} (${s.symbol}) ${verb} ${Math.abs(s.changePercent).toFixed(1)}%`,
          body,
          tags: `stockmarket,NSE,${s.symbol},IndianStocks,${s.sector || 'Finance'}`,
        }, (err: Error | null) => err ? reject(err) : resolve())
      })
      await prisma.stockEvent.update({ where: { id: s.id }, data: { tumblrPosted: true } })
      posted++
    } catch (error) {
      console.error(`[tumblr] Failed to post ${s.symbol}:`, error)
    }
  }

  return { posted }
}
