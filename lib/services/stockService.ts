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
  avgVolume: number
  marketCap: number
  week52High: number
  week52Low: number
}

const nse = new NseIndia()

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Fetch enriched data via Yahoo for a single symbol
async function enrichWithYahoo(symbol: string): Promise<{ avgVolume: number; week52High: number; week52Low: number; sector: string } | null> {
  try {
    const yahooSymbol = `${symbol}.NS`
    const quote = await yahooFinance.quote(yahooSymbol) as Record<string, unknown>
    const summary = await yahooFinance.quoteSummary(yahooSymbol, { modules: ['assetProfile', 'summaryDetail'] }) as { assetProfile?: { sector?: string }; summaryDetail?: { averageVolume10days?: number; averageDailyVolume3Month?: number } }
    const avgVolume = (summary.summaryDetail?.averageDailyVolume3Month as number) || (summary.summaryDetail?.averageVolume10days as number) || (quote.averageDailyVolume3Month as number) || 0
    return {
      avgVolume,
      week52High: (quote.fiftyTwoWeekHigh as number) ?? 0,
      week52Low: (quote.fiftyTwoWeekLow as number) ?? 0,
      sector: summary.assetProfile?.sector ?? 'Unknown',
    }
  } catch {
    return null
  }
}

async function fetchNSEMovers(): Promise<StockMoverData[]> {
  const movers: StockMoverData[] = []

  try {
    const [gainers, losers] = await Promise.all([
      nse.getEquityStockIndices('NIFTY 200'),
      nse.getEquityStockIndices('NIFTY 200'),
    ])

    const allStocks = gainers?.data || losers?.data || []

    for (const stock of allStocks) {
      const pChange = stock.pChange ?? 0
      const totalTradedVolume = stock.totalTradedVolume ?? 0

      // GUIDE: Filter to >1% minimum, raised from 3% threshold per guide section 12
      if (Math.abs(pChange) < 1 || totalTradedVolume < 100000) continue

      // Enrich with Yahoo Finance data
      const enriched = await enrichWithYahoo(stock.symbol)
      await delay(300)

      movers.push({
        symbol: stock.symbol,
        companyName: stock.meta?.companyName || stock.symbol,
        exchange: 'NSE',
        sector: stock.meta?.industry || enriched?.sector || 'Unknown',
        eventType: pChange > 0 ? 'RISE' : 'FALL',
        changePercent: Math.abs(pChange),
        changeAmount: Math.abs(stock.change ?? 0),
        openPrice: stock.open ?? 0,
        closePrice: stock.lastPrice ?? 0,
        highPrice: stock.dayHigh ?? 0,
        lowPrice: stock.dayLow ?? 0,
        volume: totalTradedVolume,
        avgVolume: enriched?.avgVolume ?? 0,
        marketCap: 0,
        week52High: enriched?.week52High ?? 0,
        week52Low: enriched?.week52Low ?? 0,
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
    'MOTHERSON.NS', 'LODHA.NS', 'TATASTEEL.NS', 'ASIANPAINT.NS', 'NTPC.NS',
  ]

  for (const sym of symbols) {
    try {
      const quote = await yahooFinance.quote(sym) as Record<string, unknown>
      if (!quote) continue
      const pChange = (quote.regularMarketChangePercent as number) ?? 0
      const volume = (quote.regularMarketVolume as number) ?? 0

      if (Math.abs(pChange) < 1 || volume < 100000) continue

      const summary = await yahooFinance.quoteSummary(sym, { modules: ['assetProfile', 'summaryDetail'] }) as { assetProfile?: { sector?: string; industry?: string }; summaryDetail?: { averageVolume10days?: number; averageDailyVolume3Month?: number } }
      const avgVolume = (summary.summaryDetail?.averageDailyVolume3Month as number) || (summary.summaryDetail?.averageVolume10days as number) || 0

      movers.push({
        symbol: sym.replace('.NS', ''),
        companyName: (quote.shortName as string) || sym,
        exchange: 'NSE',
        sector: summary.assetProfile?.industry || summary.assetProfile?.sector || 'Unknown',
        eventType: pChange > 0 ? 'RISE' : 'FALL',
        changePercent: Math.abs(pChange),
        changeAmount: Math.abs((quote.regularMarketChange as number) ?? 0),
        openPrice: (quote.regularMarketOpen as number) ?? 0,
        closePrice: (quote.regularMarketPrice as number) ?? 0,
        highPrice: (quote.regularMarketDayHigh as number) ?? 0,
        lowPrice: (quote.regularMarketDayLow as number) ?? 0,
        volume,
        avgVolume,
        marketCap: (quote.marketCap as number) ?? 0,
        week52High: (quote.fiftyTwoWeekHigh as number) ?? 0,
        week52Low: (quote.fiftyTwoWeekLow as number) ?? 0,
      })
      await delay(300)
    } catch (error) {
      console.error(`[stockService] Yahoo fallback failed for ${sym}:`, error)
    }
  }

  return movers
}

export async function getNiftyChangePercent(): Promise<number | null> {
  try {
    const quote = await yahooFinance.quote('^NSEI') as Record<string, unknown>
    return (quote?.regularMarketChangePercent as number) ?? null
  } catch {
    return null
  }
}

export async function getStockMovers(): Promise<StockMoverData[]> {
  let movers = await fetchNSEMovers()
  if (movers.length === 0) {
    console.log('[stockService] NSE returned 0 movers, trying Yahoo fallback')
    movers = await fetchYahooFallback()
  }
  return movers.slice(0, 50)
}
