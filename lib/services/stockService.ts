import { fetchGoogleFinanceStock } from './googleFinanceService'
import { getYahooFinance } from './yahooLazy'

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

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Curated list of liquid Nifty 50 + Nifty Next 50 stocks. Limited to ~50 to keep cron under timeout.
const STOCK_UNIVERSE = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
  'HINDUNILVR', 'SBIN', 'BHARTIARTL', 'KOTAKBANK', 'ITC',
  'LT', 'AXISBANK', 'BAJFINANCE', 'MARUTI', 'TATAMOTORS',
  'SUNPHARMA', 'TITAN', 'WIPRO', 'HCLTECH', 'ADANIENT',
  'ASIANPAINT', 'NTPC', 'POWERGRID', 'ULTRACEMCO', 'NESTLEIND',
  'ONGC', 'JSWSTEEL', 'TATASTEEL', 'COALINDIA', 'BAJAJFINSV',
  'HDFCLIFE', 'SBILIFE', 'INDUSINDBK', 'M&M', 'GRASIM',
  'CIPLA', 'DRREDDY', 'TECHM', 'BRITANNIA', 'EICHERMOT',
  'HEROMOTOCO', 'BPCL', 'IOC', 'DIVISLAB', 'APOLLOHOSP',
  'TATACONSUM', 'UPL', 'SHRIRAMFIN', 'ADANIPORTS', 'HINDALCO',
]

// Sector mapping for known stocks (since Google Finance doesn't expose sector cleanly)
const SECTOR_MAP: Record<string, string> = {
  RELIANCE: 'Energy', TCS: 'IT', HDFCBANK: 'Banking', INFY: 'IT', ICICIBANK: 'Banking',
  HINDUNILVR: 'FMCG', SBIN: 'Banking', BHARTIARTL: 'Telecom', KOTAKBANK: 'Banking', ITC: 'FMCG',
  LT: 'Construction', AXISBANK: 'Banking', BAJFINANCE: 'NBFC', MARUTI: 'Auto', TATAMOTORS: 'Auto',
  SUNPHARMA: 'Pharma', TITAN: 'Consumer', WIPRO: 'IT', HCLTECH: 'IT', ADANIENT: 'Diversified',
  ASIANPAINT: 'Paints', NTPC: 'Power', POWERGRID: 'Power', ULTRACEMCO: 'Cement', NESTLEIND: 'FMCG',
  ONGC: 'Energy', JSWSTEEL: 'Metals', TATASTEEL: 'Metals', COALINDIA: 'Mining', BAJAJFINSV: 'NBFC',
  HDFCLIFE: 'Insurance', SBILIFE: 'Insurance', INDUSINDBK: 'Banking', 'M&M': 'Auto', GRASIM: 'Cement',
  CIPLA: 'Pharma', DRREDDY: 'Pharma', TECHM: 'IT', BRITANNIA: 'FMCG', EICHERMOT: 'Auto',
  HEROMOTOCO: 'Auto', BPCL: 'Energy', IOC: 'Energy', DIVISLAB: 'Pharma', APOLLOHOSP: 'Healthcare',
  TATACONSUM: 'FMCG', UPL: 'Chemicals', SHRIRAMFIN: 'NBFC', ADANIPORTS: 'Infrastructure', HINDALCO: 'Metals',
}

async function fetchGoogleMovers(): Promise<StockMoverData[]> {
  const movers: StockMoverData[] = []

  for (const symbol of STOCK_UNIVERSE) {
    try {
      const stock = await fetchGoogleFinanceStock(symbol)
      await delay(400) // be polite to Google

      if (!stock) continue

      // Filter by minimum % move (>= 1%)
      if (Math.abs(stock.changePercent) < 1) continue

      // Volume not available from Google Finance compact stats - use avgVolume as proxy
      // Skip if no avgVolume data (likely failed parse)
      if (stock.avgVolume <= 0) continue

      movers.push({
        symbol: stock.symbol,
        companyName: stock.companyName,
        exchange: 'NSE',
        sector: SECTOR_MAP[symbol] || 'Diversified',
        eventType: stock.changePercent > 0 ? 'RISE' : 'FALL',
        changePercent: Math.abs(stock.changePercent),
        changeAmount: Math.abs(stock.change),
        openPrice: stock.prevClose, // Google Finance shows "Open" which we mapped to prevClose
        closePrice: stock.price,
        highPrice: stock.dayHigh || stock.price,
        lowPrice: stock.dayLow || stock.price,
        volume: stock.avgVolume, // Use avg volume as today's volume proxy
        avgVolume: stock.avgVolume,
        marketCap: stock.marketCap,
        week52High: stock.yearHigh,
        week52Low: stock.yearLow,
      })
    } catch (error) {
      console.error(`[stockService] Google Finance failed for ${symbol}:`, error instanceof Error ? error.message : error)
    }
  }

  return movers
}

async function fetchYahooFallback(): Promise<StockMoverData[]> {
  const movers: StockMoverData[] = []

  // Lazy-load Yahoo Finance to prevent its cookie jar from leaking across requests.
  // The instance lives only for this function call, then gets garbage-collected.
  const yahooFinance = await getYahooFinance()

  for (const sym of STOCK_UNIVERSE.slice(0, 25)) {
    try {
      const yahooSym = `${sym}.NS`
      const quote = await yahooFinance.quote(yahooSym) as Record<string, unknown>
      if (!quote) continue
      const pChange = (quote.regularMarketChangePercent as number) ?? 0
      const volume = (quote.regularMarketVolume as number) ?? 0

      if (Math.abs(pChange) < 1 || volume < 100000) continue

      const summary = await yahooFinance.quoteSummary(yahooSym, { modules: ['assetProfile', 'summaryDetail'] }) as { assetProfile?: { sector?: string; industry?: string }; summaryDetail?: { averageVolume10days?: number; averageDailyVolume3Month?: number } }
      const avgVolume = (summary.summaryDetail?.averageDailyVolume3Month as number) || (summary.summaryDetail?.averageVolume10days as number) || 0

      movers.push({
        symbol: sym,
        companyName: (quote.shortName as string) || sym,
        exchange: 'NSE',
        sector: summary.assetProfile?.industry || summary.assetProfile?.sector || SECTOR_MAP[sym] || 'Unknown',
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
      console.error(`[stockService] Yahoo fallback failed for ${sym}:`, error instanceof Error ? error.message : error)
    }
  }

  return movers
}

export async function getNiftyChangePercent(): Promise<number | null> {
  // Try Google Finance first
  try {
    const { fetchGoogleFinanceQuote } = await import('./googleFinanceService')
    const gf = await fetchGoogleFinanceQuote('^NSEI')
    if (gf && Number.isFinite(gf.changePercent)) return gf.changePercent
  } catch {}

  // Fallback to Yahoo
  try {
    const yahooFinance = await getYahooFinance()
    const quote = await yahooFinance.quote('^NSEI') as Record<string, unknown>
    return (quote?.regularMarketChangePercent as number) ?? null
  } catch {
    return null
  }
}

export async function getStockMovers(): Promise<StockMoverData[]> {
  let movers = await fetchGoogleMovers()
  console.log(`[stockService] Google Finance returned ${movers.length} movers`)

  if (movers.length === 0) {
    console.log('[stockService] Google returned 0 movers, trying Yahoo fallback')
    movers = await fetchYahooFallback()
  }

  // Sort by absolute change percent (biggest movers first), limit to 30
  movers.sort((a, b) => b.changePercent - a.changePercent)
  return movers.slice(0, 30)
}
