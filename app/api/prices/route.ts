import { NextResponse } from 'next/server'

const SYMBOLS = '^NSEI,^BSESN,GC=F,SI=F'
let cache: { data: unknown; ts: number } | null = null

export async function GET() {
  const now = Date.now()
  if (cache && now - cache.ts < 30000) {
    return NextResponse.json(cache.data, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } })
  }

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${SYMBOLS}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,shortName`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    if (!res.ok) throw new Error('Yahoo API error')
    const json = await res.json()

    const data = json.quoteResponse.result.map((q: any) => ({
      symbol: q.symbol,
      price: q.regularMarketPrice,
      change: q.regularMarketChange,
      changePercent: q.regularMarketChangePercent,
    }))

    cache = { data, ts: now }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } })
  } catch {
    return NextResponse.json(cache?.data || [], { status: cache ? 200 : 500 })
  }
}
