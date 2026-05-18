import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import { prisma } from '@/lib/db/prisma'

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] })
const TROY_OZ_TO_GRAM = 31.1035
let cache: { data: unknown; ts: number } | null = null

// Reject any changePercent with absurd magnitude (data corruption indicator)
function safePct(pct: number | null | undefined): number {
  if (typeof pct !== 'number' || !isFinite(pct)) return 0
  if (Math.abs(pct) > 50) return 0 // cap at sanity threshold
  return pct
}

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
    const [indexResults, metalPrices, dbMetals, dbIndices] = await Promise.all([
      Promise.allSettled([
        yahooFinance.quote('^NSEI'),
        yahooFinance.quote('^BSESN'),
      ]),
      fetchMetalPrices(),
      prisma.metalEvent.findMany({
        where: { isPublished: true, metal: { in: ['GOLD', 'SILVER'] } },
        orderBy: { publishedAt: 'desc' },
        distinct: ['metal'],
        select: { metal: true, pricePerGram: true, changePercent: true, eventType: true },
      }),
      prisma.indexEvent.findMany({
        where: { isPublished: true, indexName: { in: ['Nifty 50', 'Sensex'] } },
        orderBy: { publishedAt: 'desc' },
        distinct: ['indexName'],
        select: { indexName: true, closeValue: true, changePoints: true, changePercent: true, eventType: true },
      }),
    ])

    // Log Yahoo failures explicitly so it shows in Railway logs
    indexResults.forEach((r, i) => {
      const sym = i === 0 ? '^NSEI' : '^BSESN'
      if (r.status === 'rejected') {
        console.warn(`[prices] Yahoo Finance failed for ${sym}:`, r.reason instanceof Error ? r.reason.message : r.reason)
      }
    })

    const yahooIndices = indexResults
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => {
        const q = (r as PromiseFulfilledResult<any>).value
        return {
          symbol: q.symbol,
          price: q.regularMarketPrice,
          change: q.regularMarketChange,
          changePercent: safePct(q.regularMarketChangePercent),
        }
      })

    // Fallback to DB for any index Yahoo couldn't fetch
    const haveYahooNifty = yahooIndices.some(i => i.symbol === '^NSEI')
    const haveYahooSensex = yahooIndices.some(i => i.symbol === '^BSESN')
    const niftyDb = dbIndices.find(d => d.indexName === 'Nifty 50')
    const sensexDb = dbIndices.find(d => d.indexName === 'Sensex')

    const indices = [...yahooIndices]
    if (!haveYahooNifty && niftyDb && niftyDb.closeValue > 0) {
      const pct = safePct(niftyDb.eventType === 'FALL' ? -niftyDb.changePercent : niftyDb.changePercent)
      indices.push({ symbol: '^NSEI', price: niftyDb.closeValue, change: niftyDb.changePoints * (niftyDb.eventType === 'FALL' ? -1 : 1), changePercent: pct })
    }
    if (!haveYahooSensex && sensexDb && sensexDb.closeValue > 0) {
      const pct = safePct(sensexDb.eventType === 'FALL' ? -sensexDb.changePercent : sensexDb.changePercent)
      indices.push({ symbol: '^BSESN', price: sensexDb.closeValue, change: sensexDb.changePoints * (sensexDb.eventType === 'FALL' ? -1 : 1), changePercent: pct })
    }

    const metalItems: any[] = []
    const goldDb = dbMetals.find(m => m.metal === 'GOLD')
    const silverDb = dbMetals.find(m => m.metal === 'SILVER')

    const goldPrice = metalPrices?.gold || (goldDb?.pricePerGram && goldDb.pricePerGram > 0 && goldDb.pricePerGram < 100000 ? goldDb.pricePerGram : 0)
    const silverPrice = metalPrices?.silver || (silverDb?.pricePerGram && silverDb.pricePerGram > 0 && silverDb.pricePerGram < 10000 ? silverDb.pricePerGram : 0)

    if (goldPrice > 0) {
      const rawPct = goldDb ? (goldDb.eventType === 'FALL' ? -goldDb.changePercent : goldDb.changePercent) : 0
      const pct = safePct(rawPct)
      metalItems.push({ symbol: 'GC=F', price: goldPrice, change: goldPrice * pct / 100, changePercent: pct })
    }
    if (silverPrice > 0) {
      const rawPct = silverDb ? (silverDb.eventType === 'FALL' ? -silverDb.changePercent : silverDb.changePercent) : 0
      const pct = safePct(rawPct)
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
