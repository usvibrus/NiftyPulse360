import axios from 'axios'
import { prisma } from '@/lib/db/prisma'

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getFirstBoard(accessToken: string): Promise<string | null> {
  try {
    const res = await axios.get('https://api.pinterest.com/v5/boards', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.data.items && res.data.items.length > 0) {
      return res.data.items[0].id
    }
    return null
  } catch (error) {
    console.error('[pinterest] Failed to get boards:', error)
    return null
  }
}

export async function postToPinterest() {
  const accessToken = process.env.PINTEREST_ACCESS_TOKEN
  if (!accessToken) { console.log('[pinterest] No access token configured'); return { posted: 0 } }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const boardId = process.env.PINTEREST_BOARD_ID || await getFirstBoard(accessToken)
  if (!boardId) { console.log('[pinterest] No board found'); return { posted: 0 } }

  let posted = 0

  const stocks = await prisma.stockEvent.findMany({
    where: { isPublished: true, tweetPosted: false },
    take: 10,
    orderBy: { publishedAt: 'desc' },
    select: { slug: true, companyName: true, symbol: true, eventType: true, changePercent: true, metaTitle: true, metaDesc: true },
  })

  for (const s of stocks) {
    if (posted >= 3) break
    const pageUrl = `${siteUrl}/stocks/${s.slug}`
    const ogImage = `${siteUrl}/api/og?title=${encodeURIComponent(s.metaTitle)}&symbol=${s.symbol}&change=${s.changePercent.toFixed(1)}%25&type=${s.eventType}`

    try {
      await axios.post('https://api.pinterest.com/v5/pins', {
        board_id: boardId,
        title: s.metaTitle,
        description: `${s.metaDesc} #StockMarket #NSE #${s.symbol}`,
        link: pageUrl,
        media_source: { source_type: 'image_url', url: ogImage },
      }, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      })
      posted++
      await delay(5000)
    } catch (error) {
      console.error(`[pinterest] Failed to pin ${s.symbol}:`, error)
    }
  }

  return { posted }
}
