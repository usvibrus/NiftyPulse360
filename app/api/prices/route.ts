import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import { prisma } from '@/lib/db/prisma'

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] })
const TROY_OZ_TO_GRAM = 31.1035
let cache: { data: unknown; ts: number } | null = null

async function fetchMetalPrices(): Promise<{ gold: number; silver: number } | null> {
  try {
    const key = process.env.METALPRICE_API_KEY
    if (!key) return null
    const res = await fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${key}&base=INR&currencies=XAU,XAG`)
    if (!res.ok) return null
    const data = await res.json()
    return {
      gold: (1 / data.rates.INRXAU) / TROY_OZ_TO_GRAM,
      silver: (1 / data.rates.INRXAG) / TROY_OZ_TO_GRAM,
    }
  } catch { return null }
}

export async function GET() {
  const now = Date.now()
  if (cache && now - cache.ts < 30000) {
    return NextResponse.json(cache.data, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } })
  }

  try {
    const [indexResults, metalPrices, dbMetals] = await Promise.all([
      Promise.allSettled(['^NSEI', '^BSESN'].map(s => yahooFinance.quote(s))),
      fetchMetalPrices(),
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

    const metalItems: any[] = []
    const goldDb = dbMetals.find(m => m.metal === 'GOLD')
    const silverDb = dbMetals.find(m => m.metal === 'SILVER')

    const goldPrice = metalPrices?.gold || (goldDb?.pricePerGram && goldDb.pricePerGram > 0 ? goldDb.pricePerGram : 0)
    const silverPrice = metalPrices?.silver || (silverDb?.pricePerGram && silverDb.pricePerGram > 0 ? silverDb.pricePerGram : 0)

    if (goldPrice > 0) {
      const pct = goldDb ? (goldDb.eventType === 'FALL' ? -goldDb.changePercent : goldDb.changePercent) : 0
      metalItems.push({ symbol: 'GC=F', price: goldPrice, change: goldPrice * pct / 100, changePercent: pct })
    }
    if (silverPrice > 0) {
      const pct = silverDb ? (silverDb.eventType === 'FALL' ? -silverDb.changePercent : silverDb.changePercent) : 0
      metalItems.push({ symbol: 'SI=F', price: silverPrice, change: silverPrice * pct / 100, changePercent: pct })
    }

    const data = [...indices, ...metalItems]
    if (data.length > 0) cache = { data, ts: now }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } })
  } catch (e) {
    console.error('Prices API error:', e)
    return NextResponse.json(cache?.data || [], { status: cache ? 200 : 500 })
  }
}
