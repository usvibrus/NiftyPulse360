import { prisma } from '@/lib/db/prisma'

export async function postToDevTo() {
  const apiKey = process.env.DEV_TO_API_KEY
  if (!apiKey) { console.log('[devto] No API key configured'); return { posted: 0 } }

  // An empty fallback produced relative links (and a relative canonical_url) on dev.to
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'
  let posted = 0

  const stocks = await prisma.stockEvent.findMany({
    where: { devtoPosted: false, isPublished: true },
    take: 2,
    orderBy: { publishedAt: 'desc' },
  })

  for (let i = 0; i < stocks.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 35000))
    const s = stocks[i]
    const verb = s.eventType === 'RISE' ? 'surged' : 'dropped'
    const emoji = s.eventType === 'RISE' ? '📈' : '📉'
    const direction = s.eventType === 'RISE' ? 'up' : 'down'
    const date = new Date(s.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    const coverImage = `${siteUrl}/api/og?title=${encodeURIComponent(`${s.companyName} shares ${verb} ${Math.abs(s.changePercent).toFixed(1)}%`)}&symbol=${encodeURIComponent(s.symbol)}&change=${encodeURIComponent(`${Math.abs(s.changePercent).toFixed(1)}%`)}&type=${s.eventType}`

    const markdown = `
${emoji} **${s.companyName}** (NSE: ${s.symbol}) shares ${verb} **${Math.abs(s.changePercent).toFixed(1)}%** on ${date}, closing at ₹${s.closePrice.toFixed(2)}.

---

## 📊 Market Snapshot

| Metric | Value |
|--------|-------|
| **Open** | ₹${s.openPrice.toFixed(2)} |
| **Close** | ₹${s.closePrice.toFixed(2)} |
| **High** | ₹${s.highPrice.toFixed(2)} |
| **Low** | ₹${s.lowPrice.toFixed(2)} |
| **Change** | ${s.eventType === 'RISE' ? '+' : '-'}${Math.abs(s.changePercent).toFixed(2)}% (₹${Math.abs(s.changeAmount).toFixed(2)}) |
| **Volume** | ${Number(s.volume).toLocaleString('en-IN')} |
${[
  s.marketCap ? `| **Market Cap** | ₹${Math.round(s.marketCap / 1e7).toLocaleString('en-IN')} Cr |` : '',
  s.week52High ? `| **52W High** | ₹${s.week52High.toFixed(2)} |` : '',
  s.week52Low ? `| **52W Low** | ₹${s.week52Low.toFixed(2)} |` : '',
].filter(Boolean).join('\n')}

---

## 🔍 Analysis

${s.aiAnalysis || `${s.companyName} saw significant ${direction}ward movement today with ${Math.abs(s.changePercent).toFixed(1)}% change on the NSE.`}

---

## 🏷️ About ${s.companyName}

- **Exchange:** NSE
- **Sector:** ${s.sector || 'N/A'}
${s.niftyChange ? `- **Nifty Change:** ${s.niftyChange > 0 ? '+' : ''}${s.niftyChange.toFixed(2)}%` : ''}

---

> 💡 *For educational purposes only. Not financial advice.*

📖 **[Read the full detailed analysis on NiftyPulse360 →](${siteUrl}/stocks/${s.slug})**
`

    try {
      const res = await fetch('https://dev.to/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({
          article: {
            title: `${emoji} ${s.companyName} (${s.symbol}) ${verb} ${Math.abs(s.changePercent).toFixed(1)}% — NSE ${date}`,
            body_markdown: markdown,
            published: true,
            main_image: coverImage,
            tags: ['stockmarket', 'india', 'finance', 'investing'],
            canonical_url: `${siteUrl}/stocks/${s.slug}`,
            series: 'Indian Stock Market Daily',
          },
        }),
        // Without a timeout a hung dev.to request stalls the whole stocks cron run
        signal: AbortSignal.timeout(15000),
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
