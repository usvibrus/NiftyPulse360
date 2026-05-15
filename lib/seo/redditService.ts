import Snoowrap from 'snoowrap'
import { prisma } from '@/lib/db/prisma'

function getClient(): Snoowrap | null {
  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  const username = process.env.REDDIT_USERNAME
  const password = process.env.REDDIT_PASSWORD
  if (!clientId || !clientSecret || !username || !password) return null
  return new Snoowrap({ userAgent: 'NiftyPulse360 Bot v1.0', clientId, clientSecret, username, password })
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const SUBREDDITS = ['IndianStockMarket', 'IndianStreetBets', 'DalalStreetTalks']

export async function postToReddit() {
  const client = getClient()
  if (!client) { console.log('[reddit] No credentials configured'); return { posted: 0 } }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  let posted = 0

  const stocks = await prisma.stockEvent.findMany({
    where: { tweetPosted: false, isPublished: true },
    take: 3,
    orderBy: { changePercent: 'desc' },
  })

  for (const s of stocks) {
    if (posted >= 3) break
    const verb = s.eventType === 'RISE' ? 'rose' : 'fell'
    const title = `Why did ${s.companyName} (${s.symbol}) share price ${verb} ${s.changePercent.toFixed(1)}% today?`
    const url = `${siteUrl}/stocks/${s.slug}`

    for (const sub of SUBREDDITS) {
      try {
        await client.getSubreddit(sub).submitLink({ title, url, resubmit: false })
        posted++
        await delay(10000) // 10s delay between posts to avoid spam detection
      } catch (error) {
        console.error(`[reddit] Failed to post to r/${sub}:`, error)
      }
    }

    await prisma.stockEvent.update({ where: { id: s.id }, data: { tweetPosted: true } })
  }

  return { posted }
}
