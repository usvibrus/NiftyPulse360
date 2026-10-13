import { fetchGoogleFinanceIndex } from './googleFinanceService'
import { getYahooFinance } from './yahooLazy'

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

  // Lazy-load Yahoo Finance — only the rare fallback path actually uses it,
  // and we want its cookie jar to be GC'd after this function returns.
  let yahooFinance: Awaited<ReturnType<typeof getYahooFinance>> | null = null

  for (const idx of INDICES) {
    // Whether Google Finance returned a usable quote at all. A valid quote with a small
    // move must not fall through to Yahoo, which can report a different change basis.
    let gfOk = false

    // 1. Try Google Finance first (works on cloud, no API key)
    try {
      const gf = await fetchGoogleFinanceIndex(idx.symbol)
      gfOk = !!gf && gf.price > 0
      if (gf && gfOk && Math.abs(gf.changePercent) >= 0.5) {
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
      }
    } catch (error) {
      console.error(`[indicesService] Google Finance failed for ${idx.symbol}:`, error instanceof Error ? error.message : error)
    }

    // 2. Fallback to Yahoo Finance (rarely works on cloud, but try)
    if (!gfOk) {
      try {
        if (!yahooFinance) yahooFinance = await getYahooFinance()
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
