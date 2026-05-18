import YahooFinance from 'yahoo-finance2'
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
  { symbol: '^INDIAVIX', name: 'India VIX' },
]

export async function getIndexMovers(): Promise<IndexMoverData[]> {
  const movers: IndexMoverData[] = []

  for (const idx of INDICES) {
    try {
      const quote = await yahooFinance.quote(idx.symbol) as Record<string, unknown>
      if (!quote) continue

      const pChange = (quote.regularMarketChangePercent as number) ?? 0
      if (Math.abs(pChange) < 0.5) continue

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
    } catch (error) {
      console.error(`[indicesService] Failed for ${idx.symbol}:`, error)
    }
  }

  return movers
}
