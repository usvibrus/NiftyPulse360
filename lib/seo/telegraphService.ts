import { prisma } from '@/lib/db/prisma'

export async function postToTelegraph() {
  const token = process.env.TELEGRAPH_ACCESS_TOKEN
  if (!token) { console.log('[telegraph] No token configured'); return { posted: 0 } }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  let posted = 0

  const stocks = await prisma.stockEvent.findMany({
    where: { telegraphPosted: false, isPublished: true },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  })

  for (const s of stocks) {
    const verb = s.eventType === 'RISE' ? 'surged' : 'dropped'
    const emoji = s.eventType === 'RISE' ? '📈' : '📉'
    const date = new Date(s.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    const coverImage = `${siteUrl}/api/og?title=${encodeURIComponent(`${s.companyName} shares ${verb} ${Math.abs(s.changePercent).toFixed(1)}%`)}&symbol=${encodeURIComponent(s.symbol)}&change=${encodeURIComponent(`${Math.abs(s.changePercent).toFixed(1)}%`)}&type=${s.eventType}`

    const content = JSON.stringify([
      { tag: 'img', attrs: { src: coverImage } },
      { tag: 'h3', children: [`${emoji} ${s.companyName} (${s.symbol}) ${verb} ${Math.abs(s.changePercent).toFixed(1)}%`] },
      { tag: 'p', children: [{ tag: 'em', children: [`NSE • ${s.sector || 'Equity'} • ${date}`] }] },
      { tag: 'hr' },
      { tag: 'h4', children: ['📊 Market Data'] },
      { tag: 'p', children: [{ tag: 'strong', children: ['Open:'] }, ` ₹${s.openPrice.toFixed(2)}  |  `, { tag: 'strong', children: ['Close:'] }, ` ₹${s.closePrice.toFixed(2)}`] },
      { tag: 'p', children: [{ tag: 'strong', children: ['High:'] }, ` ₹${s.highPrice.toFixed(2)}  |  `, { tag: 'strong', children: ['Low:'] }, ` ₹${s.lowPrice.toFixed(2)}`] },
      { tag: 'p', children: [{ tag: 'strong', children: ['Change:'] }, ` ${s.eventType === 'RISE' ? '+' : '-'}${Math.abs(s.changePercent).toFixed(2)}% (₹${Math.abs(s.changeAmount).toFixed(2)})`] },
      { tag: 'p', children: [{ tag: 'strong', children: ['Volume:'] }, ` ${Number(s.volume).toLocaleString('en-IN')}`] },
      ...(s.marketCap ? [{ tag: 'p', children: [{ tag: 'strong', children: ['Market Cap:'] }, ` ₹${(s.marketCap / 10000000).toFixed(0)} Cr`] }] : []),
      ...(s.week52High && s.week52Low ? [{ tag: 'p', children: [{ tag: 'strong', children: ['52W Range:'] }, ` ₹${s.week52Low.toFixed(2)} — ₹${s.week52High.toFixed(2)}`] }] : []),
      { tag: 'hr' },
      { tag: 'h4', children: ['🔍 Analysis'] },
      { tag: 'p', children: [s.aiAnalysis ? s.aiAnalysis.slice(0, 800) : `${s.companyName} saw significant movement of ${Math.abs(s.changePercent).toFixed(1)}% on the NSE today.`] },
      { tag: 'hr' },
      { tag: 'p', children: [{ tag: 'strong', children: [{ tag: 'a', attrs: { href: `${siteUrl}/stocks/${s.slug}` }, children: ['📖 Read Full Analysis on NiftyPulse360 →'] }] }] },
      { tag: 'p', children: [{ tag: 'em', children: ['Disclaimer: For educational purposes only. Not financial advice.'] }] },
    ])

    try {
      const res = await fetch('https://api.telegra.ph/createPage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: token,
          title: `${emoji} ${s.companyName} (${s.symbol}) ${verb} ${Math.abs(s.changePercent).toFixed(1)}% — NSE ${date}`,
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

// Service reliability verified
