import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import { prisma } from '@/lib/db/prisma'
import { fetchStooqIndex } from '@/lib/services/stooqService'
import { fetchExchangeRateMetals } from '@/lib/services/exchangeRateService'
import { fetchTwelveDataQuote } from '@/lib/services/twelveDataService'

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] })
const TROY_OZ_TO_GRAM = 31.1035
let cache: { data: unknown; ts: number } | null = null

function safePct(pct: number | null | undefined): number {
  if (typeof pct !== 'number' || !isFinite(pct)) return 0
  if (Math.abs(pct) > 50) return 0
  return pct
}

// PRIMARY: Twelve Data (free 800/day, reliable for Indian indices)
// FALLBACK 1: Yahoo Finance (often blocked on cloud IPs)
// FALLBACK 2: Stooq (only works for some symbols, not Indian indices)
// FALLBACK 3: DB latest IndexEvent
async function fetchIndices(): Promise<{ symbol: string; price: number; change: number; changePercent: number }[]> {
  const out: { symbol: string; price: number; change: number; changePercent: number }[] = []

  // 1. Try Twelve Data first
  const [niftyTd, sensexTd] = await Promise.all([
    fetchTwelveDataQuote('^NSEI'),
    fetchTwelveDataQuote('^BSESN'),
  ])
  if (niftyTd) out.push({ ...niftyTd, changePercent: safePct(niftyTd.changePercent) })
  if (sensexTd) out.push({ ...sensexTd, changePercent: safePct(sensexTd.changePercent) })

  // 2. Fill gaps with Yahoo
  const haveNifty = out.some(i => i.symbol === '^NSEI')
  const haveSensex = out.some(i => i.symbol === '^BSESN')

  if (!haveNifty || !haveSensex) {
    const yahooResults = await Promise.allSettled([
      !haveNifty ? yahooFinance.quote('^NSEI') : Promise.resolve(null),
      !haveSensex ? yahooFinance.quote('^BSESN') : Promise.resolve(null),
    ])
    yahooResults.forEach((r, i) => {
      const sym = i === 0 ? '^NSEI' : '^BSESN'
      if (r.status === 'fulfilled' && r.value) {
        const q = r.value as any
        if (q.regularMarketPrice) {
          out.push({
            symbol: sym,
            price: q.regularMarketPrice,
            change: q.regularMarketChange ?? 0,
            changePercent: safePct(q.regularMarketChangePercent),
          })
        }
      }
    })
  }

  // 3. Try Stooq as last network fallback (rarely works for Indian indices but free to try)
  const stillMissingNifty = !out.some(i => i.symbol === '^NSEI')
  const stillMissingSensex = !out.some(i => i.symbol === '^BSESN')
  if (stillMissingNifty || stillMissingSensex) {
    const [niftyStooq, sensexStooq] = await Promise.all([
      stillMissingNifty ? fetchStooqIndex('^NSEI') : Promise.resolve(null),
      stillMissingSensex ? fetchStooqIndex('^BSESN') : Promise.resolve(null),
    ])
    if (niftyStooq) out.push({ ...niftyStooq, symbol: '^NSEI', changePercent: safePct(niftyStooq.changePercent) })
    if (sensexStooq) out.push({ ...sensexStooq, symbol: '^BSESN', changePercent: safePct(sensexStooq.changePercent) })
  }

  return out
}

async function fetchMetalPriceAPI(): Promise<{ gold: number; silver: number } | null> {
  try {
    const key = process.env.METALPRICE_API_KEY
    if (!key) return null
    const res = await fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${key}&base=INR&currencies=XAU,XAG`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.rates?.INRXAU || !data.rates?.INRXAG) return null
    return {
      gold: (1 / data.rates.INRXAU) / TROY_OZ_TO_GRAM,
      silver: (1 / data.rates.INRXAG) / TROY_OZ_TO_GRAM,
    }
  } catch { return null }
}

// PRIMARY: ExchangeRate.host (free, unlimited)
// FALLBACK 1: MetalpriceAPI (paid key)
// FALLBACK 2: DB
async function fetchMetals(): Promise<{ gold: number; silver: number } | null> {
  return (await fetchExchangeRateMetals()) ?? (await fetchMetalPriceAPI())
}

export async function GET() {
  const now = Date.now()
  if (cache && now - cache.ts < 30000) {
    return NextResponse.json(cache.data, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } })
  }

  try {
    const [indices, metalPrices, dbMetals, dbIndices] = await Promise.all([
      fetchIndices(),
      fetchMetals(),
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

    // DB fallback for any missing index
    const haveNifty = indices.some(i => i.symbol === '^NSEI')
    const haveSensex = indices.some(i => i.symbol === '^BSESN')
    const niftyDb = dbIndices.find(d => d.indexName === 'Nifty 50')
    const sensexDb = dbIndices.find(d => d.indexName === 'Sensex')

    if (!haveNifty && niftyDb && niftyDb.closeValue > 0) {
      const pct = safePct(niftyDb.eventType === 'FALL' ? -niftyDb.changePercent : niftyDb.changePercent)
      indices.push({ symbol: '^NSEI', price: niftyDb.closeValue, change: niftyDb.changePoints * (niftyDb.eventType === 'FALL' ? -1 : 1), changePercent: pct })
    }
    if (!haveSensex && sensexDb && sensexDb.closeValue > 0) {
      const pct = safePct(sensexDb.eventType === 'FALL' ? -sensexDb.changePercent : sensexDb.changePercent)
      indices.push({ symbol: '^BSESN', price: sensexDb.closeValue, change: sensexDb.changePoints * (sensexDb.eventType === 'FALL' ? -1 : 1), changePercent: pct })
    }

    // Metals
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
    console.error('[prices] fatal error:', e instanceof Error ? e.message : e)
    return NextResponse.json(cache?.data || [], { status: cache ? 200 : 500 })
  }
}
