import { NseIndia } from 'stock-nse-india'
import yahooFinance from 'yahoo-finance2'

export interface StockMoverData {
  symbol: string
  companyName: string
  exchange: string
  sector: string
  eventType: 'RISE' | 'FALL'
  changePercent: number
  changeAmount: number
  openPrice: number
  closePrice: number
  highPrice: number
  lowPrice: number
  volume: number
  marketCap: number
}

const nse = new NseIndia()

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchNSEMovers(): Promise<StockMoverData[]> {
  const movers: StockMoverData[] = []

  try {
    const [gainers, losers] = await Promise.all([
      nse.getEquityStockIndices('NIFTY 200'),
      nse.getEquityStockIndices('NIFTY 200'),
    ])

    const allStocks = gainers?.data || []

    for (const stock of allStocks) {
      const pChange = stock.pChange ?? 0
      const totalTradedVolume = stock.totalTradedVolume ?? 0

      if (Math.abs(pChange) < 3 || totalTradedVolume < 100000) continue

      movers.push({
        symbol: stock.symbol,
        companyName: stock.meta?.companyName || stock.symbol,
        exchange: 'NSE',
        sector: stock.meta?.industry || 'Unknown',
        eventType: pChange > 0 ? 'RISE' : 'FALL',
        changePercent: Math.abs(pChange),
        changeAmount: Math.abs(stock.change ?? 0),
        openPrice: stock.open ?? 0,
        closePrice: stock.lastPrice ?? 0,
        highPrice: stock.dayHigh ?? 0,
        lowPrice: stock.dayLow ?? 0,
        volume: totalTradedVolume,
        marketCap: 0,
      })
    }
  } catch (error) {
    console.error('[stockService] NSE fetch failed:', error)
  }

  return movers
}

async function fetchYahooFallback(): Promise<StockMoverData[]> {
  const movers: StockMoverData[] = []
  const symbols = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
    'HINDUNILVR.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS', 'ITC.NS',
    'LT.NS', 'AXISBANK.NS', 'BAJFINANCE.NS', 'MARUTI.NS', 'TATAMOTORS.NS',
    'SUNPHARMA.NS', 'TITAN.NS', 'WIPRO.NS', 'HCLTECH.NS', 'ADANIENT.NS',
  ]

  for (const sym of symbols) {
    try {
      const quote = await yahooFinance.quote(sym) as Record<string, unknown>
      if (!quote) continue
      const pChange = (quote.regularMarketChangePercent as number) ?? 0
      const volume = (quote.regularMarketVolume as number) ?? 0

      if (Math.abs(pChange) < 3 || volume < 100000) continue

      movers.push({
        symbol: sym.replace('.NS', ''),
        companyName: (quote.shortName as string) || sym,
        exchange: 'NSE',
        sector: 'Unknown',
        eventType: pChange > 0 ? 'RISE' : 'FALL',
        changePercent: Math.abs(pChange),
        changeAmount: Math.abs((quote.regularMarketChange as number) ?? 0),
        openPrice: (quote.regularMarketOpen as number) ?? 0,
        closePrice: (quote.regularMarketPrice as number) ?? 0,
        highPrice: (quote.regularMarketDayHigh as number) ?? 0,
        lowPrice: (quote.regularMarketDayLow as number) ?? 0,
        volume,
        marketCap: (quote.marketCap as number) ?? 0,
      })
      await delay(300)
    } catch (error) {
      console.error(`[stockService] Yahoo fallback failed for ${sym}:`, error)
    }
  }

  return movers
}

export async function getStockMovers(): Promise<StockMoverData[]> {
  let movers = await fetchNSEMovers()
  if (movers.length === 0) {
    console.log('[stockService] NSE returned 0 movers, trying Yahoo fallback')
    movers = await fetchYahooFallback()
  }
  return movers.slice(0, 50)
}
