import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { fetchGoogleFinanceQuote } from '@/lib/services/googleFinanceService'
import { fetchGoodReturnsMetals } from '@/lib/services/goodReturnsService'
import { fetchTwelveDataQuote } from '@/lib/services/twelveDataService'
import { fetchRapidApiMetals } from '@/lib/services/rapidApiMetalsService'
import { fetchStooqIndex } from '@/lib/services/stooqService'

let cache: { data: unknown; ts: number } | null = null
const CACHE_TTL_MS = 8 * 60 * 60 * 1000

function safePct(pct: number | null | undefined): number {
  if (typeof pct !== 'number' || !isFinite(pct)) return 0
  if (Math.abs(pct) > 50) return 0
  return pct
}

// PRIMARY: Google Finance (free, no key, reliable for Indian indices)
// FALLBACK 1: Twelve Data (needs TWELVEDATA_API_KEY)
// FALLBACK 2: Stooq (unreliable for Indian indices)
// FALLBACK 3: DB latest IndexEvent
async function fetchIndices(): Promise<{ symbol: string; price: number; change: number; changePercent: number }[]> {
  const out: { symbol: string; price: number; change: number; changePercent: number }[] = []

  // 1. Try Google Finance first (free, no API key)
  const [niftyGf, sensexGf] = await Promise.all([
    fetchGoogleFinanceQuote('^NSEI'),
    fetchGoogleFinanceQuote('^BSESN'),
  ])
  if (niftyGf) out.push({ ...niftyGf, changePercent: safePct(niftyGf.changePercent) })
  if (sensexGf) out.push({ ...sensexGf, changePercent: safePct(sensexGf.changePercent) })

  // 2. Fill gaps with Twelve Data (if API key is set)
  const haveNifty = out.some(i => i.symbol === '^NSEI')
  const haveSensex = out.some(i => i.symbol === '^BSESN')

  if (!haveNifty || !haveSensex) {
    const [niftyTd, sensexTd] = await Promise.all([
      !haveNifty ? fetchTwelveDataQuote('^NSEI') : Promise.resolve(null),
      !haveSensex ? fetchTwelveDataQuote('^BSESN') : Promise.resolve(null),
    ])
    if (niftyTd) out.push({ ...niftyTd, changePercent: safePct(niftyTd.changePercent) })
    if (sensexTd) out.push({ ...sensexTd, changePercent: safePct(sensexTd.changePercent) })
  }

  // 3. Try Stooq as last network fallback
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

// PRIMARY: GoodReturns.in (free, no key, INR per gram)
// FALLBACK 1: RapidAPI (needs RAPIDAPI_KEY)
// FALLBACK 2: DB latest MetalEvent
async function fetchMetals(): Promise<{ gold: number; silver: number; goldChange: number; silverChange: number } | null> {
  // Try GoodReturns first
  const gr = await fetchGoodReturnsMetals()
  if (gr && gr.gold24k > 0) {
    return { gold: gr.gold24k, silver: gr.silver, goldChange: gr.goldChange, silverChange: gr.silverChange }
  }

  // Fallback to RapidAPI
  const rapid = await fetchRapidApiMetals()
  if (rapid) {
    return { gold: rapid.gold24k, silver: rapid.silver, goldChange: 0, silverChange: 0 }
  }

  return null
}

export async function GET() {
  const now = Date.now()
  if (cache && now - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json(cache.data, { headers: { 'Cache-Control': 'public, s-maxage=28800, stale-while-revalidate=3600' } })
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
    const metalItems: { symbol: string; price: number; change: number; changePercent: number }[] = []
    const goldDb = dbMetals.find(m => m.metal === 'GOLD')
    const silverDb = dbMetals.find(m => m.metal === 'SILVER')

    const goldPrice = metalPrices?.gold || (goldDb?.pricePerGram && goldDb.pricePerGram > 0 && goldDb.pricePerGram < 100000 ? goldDb.pricePerGram : 0)
    const silverPrice = metalPrices?.silver || (silverDb?.pricePerGram && silverDb.pricePerGram > 0 && silverDb.pricePerGram < 10000 ? silverDb.pricePerGram : 0)

    if (goldPrice > 0) {
      // Use change from GoodReturns if available, else from DB
      let pct = 0
      if (metalPrices?.goldChange && goldPrice > 0) {
        pct = safePct((metalPrices.goldChange / (goldPrice - metalPrices.goldChange)) * 100)
      } else if (goldDb) {
        pct = safePct(goldDb.eventType === 'FALL' ? -goldDb.changePercent : goldDb.changePercent)
      }
      metalItems.push({ symbol: 'GC=F', price: goldPrice, change: metalPrices?.goldChange || goldPrice * pct / 100, changePercent: pct })
    }
    if (silverPrice > 0) {
      let pct = 0
      if (metalPrices?.silverChange && silverPrice > 0) {
        pct = safePct((metalPrices.silverChange / (silverPrice - metalPrices.silverChange)) * 100)
      } else if (silverDb) {
        pct = safePct(silverDb.eventType === 'FALL' ? -silverDb.changePercent : silverDb.changePercent)
      }
      metalItems.push({ symbol: 'SI=F', price: silverPrice, change: metalPrices?.silverChange || silverPrice * pct / 100, changePercent: pct })
    }

    const data = [...indices, ...metalItems]
    if (data.length > 0) cache = { data, ts: now }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=28800, stale-while-revalidate=3600' } })
  } catch (e) {
    console.error('[prices] fatal error:', e instanceof Error ? e.message : e)
    return NextResponse.json(cache?.data || [], { status: cache ? 200 : 500 })
  }
}
