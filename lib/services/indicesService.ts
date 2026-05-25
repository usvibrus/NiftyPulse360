import YahooFinance from 'yahoo-finance2'
import { fetchGoogleFinanceIndex } from './googleFinanceService'

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

export interface IndexMoverData {
  indexName: string
  indexSymbol: string
  eventType: 'RISE' | 'FALL'
  changePercent: number
  changePoints: number
  openValue: number
  closeValue: number
  highValue: number
  lowValue: number
}

const INDICES = [
  { symbol: '^NSEI', name: 'Nifty 50' },
  { symbol: '^BSESN', name: 'Sensex' },
  { symbol: '^NSEBANK', name: 'Bank Nifty' },
  { symbol: '^CNXIT', name: 'Nifty IT' },
  { symbol: '^CNXPHARMA', name: 'Nifty Pharma' },
]

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function getIndexMovers(): Promise<IndexMoverData[]> {
  const movers: IndexMoverData[] = []

  for (const idx of INDICES) {
    let added = false

    // 1. Try Google Finance first (works on cloud, no API key)
    try {
      const gf = await fetchGoogleFinanceIndex(idx.symbol)
      if (gf && gf.price > 0 && Math.abs(gf.changePercent) >= 0.5) {
        movers.push({
          indexName: idx.name,
          indexSymbol: idx.symbol,
          eventType: gf.changePercent > 0 ? 'RISE' : 'FALL',
          changePercent: Math.abs(gf.changePercent),
          changePoints: Math.abs(gf.change),
          openValue: gf.open,
          closeValue: gf.price,
          highValue: gf.high,
          lowValue: gf.low,
        })
        added = true
      }
    } catch (error) {
      console.error(`[indicesService] Google Finance failed for ${idx.symbol}:`, error instanceof Error ? error.message : error)
    }

    // 2. Fallback to Yahoo Finance (rarely works on cloud, but try)
    if (!added) {
      try {
        const quote = await yahooFinance.quote(idx.symbol) as Record<string, unknown>
        if (quote) {
          const pChange = (quote.regularMarketChangePercent as number) ?? 0
          if (Math.abs(pChange) >= 0.5) {
            movers.push({
              indexName: idx.name,
              indexSymbol: idx.symbol,
              eventType: pChange > 0 ? 'RISE' : 'FALL',
              changePercent: Math.abs(pChange),
              changePoints: Math.abs((quote.regularMarketChange as number) ?? 0),
              openValue: (quote.regularMarketOpen as number) ?? 0,
              closeValue: (quote.regularMarketPrice as number) ?? 0,
              highValue: (quote.regularMarketDayHigh as number) ?? 0,
              lowValue: (quote.regularMarketDayLow as number) ?? 0,
            })
          }
        }
      } catch (error) {
        console.error(`[indicesService] Yahoo failed for ${idx.symbol}:`, error instanceof Error ? error.message : error)
      }
    }

    // Be polite to the server
    await delay(300)
  }

  return movers
}
