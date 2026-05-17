import { prisma } from '@/lib/db/prisma'

export async function postToDevTo() {
  const apiKey = process.env.DEV_TO_API_KEY
  if (!apiKey) { console.log('[devto] No API key configured'); return { posted: 0 } }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  let posted = 0

  const stocks = await prisma.stockEvent.findMany({
    where: { devtoPosted: false, isPublished: true },
    take: 2,
    orderBy: { changePercent: 'desc' },
  })

  for (const s of stocks) {
    const verb = s.eventType === 'RISE' ? 'surged' : 'dropped'
    const emoji = s.eventType === 'RISE' ? '📈' : '📉'

    const markdown = `## ${emoji} ${s.companyName} (${s.symbol}) ${verb} ${Math.abs(s.changePercent).toFixed(1)}% Today

**Key Stats:**
- Open: ₹${s.openPrice.toFixed(2)} | Close: ₹${s.closePrice.toFixed(2)}
- High: ₹${s.highPrice.toFixed(2)} | Low: ₹${s.lowPrice.toFixed(2)}
- Change: ${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(2)}% (₹${s.changeAmount.toFixed(2)})
- Volume: ${Number(s.volume).toLocaleString('en-IN')}

${s.aiAnalysis || ''}

---

*Read the full analysis on [NiftyPulse360](${siteUrl}/stocks/${s.slug})*`

    try {
      const res = await fetch('https://dev.to/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({
          article: {
            title: `${s.companyName} (${s.symbol}) shares ${verb} ${Math.abs(s.changePercent).toFixed(1)}% - ${new Date(s.eventDate).toLocaleDateString('en-IN')}`,
            body_markdown: markdown,
            published: true,
            tags: ['stockmarket', 'india', 'finance', 'nse'],
            canonical_url: `${siteUrl}/stocks/${s.slug}`,
          },
        }),
      })

      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
      await prisma.stockEvent.update({ where: { id: s.id }, data: { devtoPosted: true } })
      posted++
    } catch (error) {
      console.error(`[devto] Failed to post ${s.symbol}:`, error)
    }
  }

  return { posted }
}
