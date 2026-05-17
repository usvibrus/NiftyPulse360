import { prisma } from '@/lib/db/prisma'

export async function postToTelegraph() {
  const token = process.env.TELEGRAPH_ACCESS_TOKEN
  if (!token) { console.log('[telegraph] No token configured'); return { posted: 0 } }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  let posted = 0

  const stocks = await prisma.stockEvent.findMany({
    where: { telegraphPosted: false, isPublished: true },
    take: 2,
    orderBy: { changePercent: 'desc' },
  })

  for (const s of stocks) {
    const verb = s.eventType === 'RISE' ? 'surged' : 'dropped'

    const content = JSON.stringify([
      { tag: 'h3', children: [`${s.companyName} (${s.symbol}) ${verb} ${Math.abs(s.changePercent).toFixed(1)}%`] },
      { tag: 'p', children: [`Open: ₹${s.openPrice.toFixed(2)} | Close: ₹${s.closePrice.toFixed(2)}`] },
      { tag: 'p', children: [`High: ₹${s.highPrice.toFixed(2)} | Low: ₹${s.lowPrice.toFixed(2)}`] },
      { tag: 'p', children: [`Change: ${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(2)}% (₹${s.changeAmount.toFixed(2)})`] },
      { tag: 'p', children: [`Volume: ${Number(s.volume).toLocaleString('en-IN')}`] },
      { tag: 'p', children: [s.aiAnalysis ? s.aiAnalysis.slice(0, 600) : ''] },
      { tag: 'p', children: [{ tag: 'a', attrs: { href: `${siteUrl}/stocks/${s.slug}` }, children: ['Read full analysis on NiftyPulse360'] }] },
    ])

    try {
      const res = await fetch('https://api.telegra.ph/createPage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: token,
          title: `${s.companyName} (${s.symbol}) ${verb} ${Math.abs(s.changePercent).toFixed(1)}% - NSE`,
          author_name: 'NiftyPulse360',
          author_url: siteUrl,
          content,
          return_content: false,
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      await prisma.stockEvent.update({ where: { id: s.id }, data: { telegraphPosted: true } })
      posted++
      console.log(`[telegraph] Posted: ${data.result.url}`)
    } catch (error) {
      console.error(`[telegraph] Failed to post ${s.symbol}:`, error)
    }
  }

  return { posted }
}
