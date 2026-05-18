import { TwitterApi } from 'twitter-api-v2'
import { prisma } from '@/lib/db/prisma'
import { startOfDay } from 'date-fns'

function getClient(): TwitterApi | null {
  const appKey = process.env.TWITTER_API_KEY
  const appSecret = process.env.TWITTER_API_SECRET
  const accessToken = process.env.TWITTER_ACCESS_TOKEN
  const accessSecret = process.env.TWITTER_ACCESS_SECRET
  if (!appKey || !appSecret || !accessToken || !accessSecret) return null
  return new TwitterApi({ appKey, appSecret, accessToken, accessSecret })
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function postNewPages() {
  const client = getClient()
  if (!client) { console.log('[twitter] No credentials configured'); return { tweeted: 0 } }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  let tweeted = 0

  // Stock events
  const stocks = await prisma.stockEvent.findMany({ where: { tweetPosted: false, isPublished: true, publishedAt: { gte: startOfDay(new Date()) } }, take: 5, orderBy: { changePercent: 'desc' } })
  for (const s of stocks) {
    if (tweeted >= 15) break
    const emoji = s.eventType === 'RISE' ? '🚀' : '📉'
    const verb = s.eventType === 'RISE' ? 'rose' : 'fell'
    const text = `${emoji} ${s.companyName} shares ${verb} ${s.changePercent.toFixed(1)}% today on NSE\n\nFind out why: ${siteUrl}/stocks/${s.slug}\n\n#${s.symbol} #NSE #StockMarket #IndianStocks`
    try {
      await client.v2.tweet(text)
      await prisma.stockEvent.update({ where: { id: s.id }, data: { tweetPosted: true } })
      tweeted++
      await delay(30000)
    } catch (error) {
      console.error(`[twitter] Failed to tweet ${s.symbol}:`, error)
    }
  }

  // Index events
  const indices = await prisma.indexEvent.findMany({ where: { tweetPosted: false, isPublished: true, publishedAt: { gte: startOfDay(new Date()) } }, take: 3 })
  for (const i of indices) {
    if (tweeted >= 15) break
    const emoji = i.eventType === 'RISE' ? '📈' : '📉'
    const verb = i.eventType === 'RISE' ? 'rose' : 'fell'
    const text = `${emoji} ${i.indexName} ${verb} ${Math.round(i.changePoints)} points today\n\nWhy? ${siteUrl}/indices/${i.slug}\n\n#${i.indexName.replace(/\s/g, '')} #IndianStockMarket`
    try {
      await client.v2.tweet(text)
      await prisma.indexEvent.update({ where: { id: i.id }, data: { tweetPosted: true } })
      tweeted++
      await delay(30000)
    } catch (error) {
      console.error(`[twitter] Failed to tweet ${i.indexName}:`, error)
    }
  }

  // Metal events
  const metals = await prisma.metalEvent.findMany({ where: { tweetPosted: false, isPublished: true, publishedAt: { gte: startOfDay(new Date()) } }, take: 2 })
  for (const m of metals) {
    if (tweeted >= 15) break
    const emoji = '🪙'
    const verb = m.eventType === 'RISE' ? 'rose' : 'fell'
    const metalName = m.metal === 'GOLD' ? 'Gold' : 'Silver'
    const text = `${emoji} ${metalName} price ${verb} ${m.changePercent.toFixed(1)}% today in India\n\n${siteUrl}/gold/${m.slug}\n\n#GoldPrice #GoldRate #${metalName}`
    try {
      await client.v2.tweet(text)
      await prisma.metalEvent.update({ where: { id: m.id }, data: { tweetPosted: true } })
      tweeted++
      await delay(30000)
    } catch (error) {
      console.error(`[twitter] Failed to tweet ${m.metal}:`, error)
    }
  }

  return { tweeted }
}
