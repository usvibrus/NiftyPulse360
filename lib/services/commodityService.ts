import axios from 'axios'
import { getYahooFinance } from './yahooLazy'

export interface CommodityData {
  commodity: string
  eventType: 'RISE' | 'FALL'
  changePercent: number
  priceUSD: number
  priceINR: number | null
}

export interface CurrencyData {
  pair: string
  eventType: 'RISE' | 'FALL'
  changePercent: number
  rateValue: number
}

const COMMODITIES = [
  { symbol: 'CL=F', name: 'CRUDE_OIL' },
  { symbol: 'BZ=F', name: 'BRENT_CRUDE' },
]

export async function getCommodityMovers(): Promise<CommodityData[]> {
  const movers: CommodityData[] = []

  // Lazy-load Yahoo Finance to avoid leaking the cookie jar at module scope
  const yahooFinance = await getYahooFinance()

  for (const c of COMMODITIES) {
    try {
      const quote = await yahooFinance.quote(c.symbol) as Record<string, unknown>
      if (!quote) continue

      const pChange = (quote.regularMarketChangePercent as number) ?? 0
      if (Math.abs(pChange) < 1) continue

      movers.push({
        commodity: c.name,
        eventType: pChange > 0 ? 'RISE' : 'FALL',
        changePercent: Math.abs(pChange),
        priceUSD: (quote.regularMarketPrice as number) ?? 0,
        priceINR: null,
      })
    } catch (error) {
      console.error(`[commodityService] Failed for ${c.symbol}:`, error)
    }
  }

  return movers
}

export async function getCurrencyMovers(): Promise<CurrencyData[]> {
  const movers: CurrencyData[] = []

  // Lazy-load Yahoo Finance for the % change lookups inside the loop
  const yahooFinance = await getYahooFinance()

  try {
    const res = await axios.get(`https://v6.exchangerate-api.com/v6/${process.env.EXCHANGERATE_API_KEY}/latest/USD`)
    const rates = res.data.conversion_rates
    if (!rates) return movers

    const pairs = [
      { pair: 'USD_INR', rate: rates.INR },
      { pair: 'EUR_INR', rate: rates.INR / rates.EUR },
      { pair: 'GBP_INR', rate: rates.INR / rates.GBP },
    ]

    // Use Yahoo for % change since ExchangeRate-API doesn't provide it
    for (const p of pairs) {
      try {
        const symbol = p.pair.replace('_', '') + '=X'
        const quote = await yahooFinance.quote(symbol) as Record<string, unknown>
        const pChange = (quote?.regularMarketChangePercent as number) ?? 0
        if (Math.abs(pChange) < 0.3) continue

        movers.push({
          pair: p.pair,
          eventType: pChange > 0 ? 'RISE' : 'FALL',
          changePercent: Math.abs(pChange),
          rateValue: p.rate,
        })
      } catch {
        // If Yahoo fails, skip this pair
      }
    }
  } catch (error) {
    console.error('[commodityService] Currency fetch failed:', error)
  }

  return movers
}
