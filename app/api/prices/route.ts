import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import { prisma } from '@/lib/db/prisma'

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] })
let cache: { data: unknown; ts: number } | null = null

export async function GET() {
  const now = Date.now()
  if (cache && now - cache.ts < 30000) {
    return NextResponse.json(cache.data, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } })
  }

  try {
    const [indexResults, metals] = await Promise.all([
      Promise.allSettled(['^NSEI', '^BSESN'].map(s => yahooFinance.quote(s))),
      prisma.metalEvent.findMany({
        where: { isPublished: true, metal: { in: ['GOLD', 'SILVER'] } },
        orderBy: { publishedAt: 'desc' },
        distinct: ['metal'],
        select: { metal: true, pricePerGram: true, changePercent: true, eventType: true },
      }),
    ])

    const indices = indexResults
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => {
        const q = (r as PromiseFulfilledResult<any>).value
        return { symbol: q.symbol, price: q.regularMarketPrice, change: q.regularMarketChange, changePercent: q.regularMarketChangePercent }
      })

    const goldData = metals.find(m => m.metal === 'GOLD')
    const silverData = metals.find(m => m.metal === 'SILVER')

    const metalItems = [
      goldData && { symbol: 'GC=F', price: goldData.pricePerGram, change: goldData.pricePerGram * goldData.changePercent / (100 + goldData.changePercent), changePercent: goldData.eventType === 'FALL' ? -goldData.changePercent : goldData.changePercent },
      silverData && { symbol: 'SI=F', price: silverData.pricePerGram, change: silverData.pricePerGram * silverData.changePercent / (100 + silverData.changePercent), changePercent: silverData.eventType === 'FALL' ? -silverData.changePercent : silverData.changePercent },
    ].filter(Boolean)

    const data = [...indices, ...metalItems]

    if (data.length > 0) {
      cache = { data, ts: now }
    }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } })
  } catch (e) {
    console.error('Prices API error:', e)
    return NextResponse.json(cache?.data || [], { status: cache ? 200 : 500 })
  }
}
