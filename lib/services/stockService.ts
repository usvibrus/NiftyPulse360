import { fetchGoogleFinanceStock, fetchGoogleFinanceQuote } from './googleFinanceService'
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
  capCategory: 'largecap' | 'midcap' | 'smallcap'
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Large-cap: Nifty 50 (market cap > 50,000 Cr typically)
const LARGECAP_STOCKS = [
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

// Mid-cap: Nifty Midcap 50 — stocks between 5,000 - 50,000 Cr market cap
const MIDCAP_STOCKS = [
  'PERSISTENT', 'COFORGE', 'MPHASIS', 'LTIM', 'POLYCAB',
  'PIIND', 'ASTRAL', 'VOLTAS', 'PAGEIND', 'TRENT',
  'CUMMINSIND', 'GODREJCP', 'COLPAL', 'BERGEPAINT', 'INDHOTEL',
  'FEDERALBNK', 'IDFCFIRSTB', 'BANDHANBNK', 'MUTHOOTFIN', 'MANAPPURAM',
  'LICHSGFIN', 'PEL', 'CONCOR', 'IRCTC', 'HUDCO',
  'SAIL', 'NMDC', 'NATIONALUM', 'HINDPETRO', 'GAIL',
  'PETRONET', 'IGL', 'TORNTPOWER', 'NHPC', 'SJVN',
  'RECLTD', 'PFC', 'CANFINHOME', 'AARTIIND', 'DEEPAKNTR',
]

// Small-cap: Popular traded small-caps — high volatility, big % moves daily
const SMALLCAP_STOCKS = [
  // NHPC lives in MIDCAP only; MAZDOCK (below) is Mazagon Dock's real NSE symbol;
  // Amara Raja trades as ARE&M since its 2023 rename.
  'YESBANK', 'IDEA', 'SUZLON', 'IRFC',
  'RBLBANK', 'IBREALEST', 'INFIBEAM', 'DELTACORP', 'NETWORK18',
  'TV18BRDCST', 'TATACHEM', 'CHAMBLFERT', 'GNFC', 'GSFC',
  'ORIENTELEC', 'APLAPOLLO', 'FINEORG', 'CLEAN', 'KPITTECH',
  'TATAELXSI', 'HAPPSTMNDS', 'ROUTE', 'CDSL', 'ANGELONE',
  'RAILTEL', 'RVNL', 'IRCON', 'BEL', 'HAL',
  'COCHINSHIP', 'GRINDWELL', 'TIINDIA', 'CERA',
  'KAJARIACER', 'BLUESTARCO', 'DIXON', 'KAYNES', 'OLECTRA',
  'EXIDEIND', 'ARE&M', 'JBCHEPHARM', 'SOLARINDS', 'NIACL',
  'HFCL', 'TANLA', 'TEJASNET', 'ZENTEC', 'MAZDOCK',
]

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
  PERSISTENT: 'IT', COFORGE: 'IT', MPHASIS: 'IT', LTIM: 'IT', POLYCAB: 'Electricals',
  PIIND: 'Chemicals', ASTRAL: 'Plastics', VOLTAS: 'Consumer', TRENT: 'Retail', PAGEIND: 'Textiles',
  CUMMINSIND: 'Engineering', GODREJCP: 'FMCG', COLPAL: 'FMCG', BERGEPAINT: 'Paints', INDHOTEL: 'Hotels',
  FEDERALBNK: 'Banking', IDFCFIRSTB: 'Banking', BANDHANBNK: 'Banking', MUTHOOTFIN: 'NBFC', MANAPPURAM: 'NBFC',
  SAIL: 'Metals', NMDC: 'Mining', NATIONALUM: 'Metals', HINDPETRO: 'Energy', GAIL: 'Energy',
  IRCTC: 'Railways', HUDCO: 'Finance', CONCOR: 'Logistics', PEL: 'Finance', LICHSGFIN: 'Finance',
  YESBANK: 'Banking', IDEA: 'Telecom', SUZLON: 'Renewables', IRFC: 'Railways', NHPC: 'Power',
  RBLBANK: 'Banking', IBREALEST: 'Realty', DELTACORP: 'Gaming', TATACHEM: 'Chemicals',
  KPITTECH: 'IT', TATAELXSI: 'IT', HAPPSTMNDS: 'IT', CDSL: 'Finance', ANGELONE: 'Finance',
  RAILTEL: 'Railways', RVNL: 'Railways', IRCON: 'Railways', BEL: 'Defence', HAL: 'Defence',
  COCHINSHIP: 'Defence', DIXON: 'Electronics', KAYNES: 'Electronics', OLECTRA: 'EV',
  EXIDEIND: 'Auto', 'ARE&M': 'Auto', HFCL: 'Telecom', TANLA: 'IT', MAZDOCK: 'Defence',
  RECLTD: 'Power', PFC: 'Power', TORNTPOWER: 'Power', SJVN: 'Power', PETRONET: 'Energy', IGL: 'Energy',
}

// Minimum % change thresholds per category
const MIN_CHANGE_LARGECAP = 4
const MIN_CHANGE_MIDCAP = 4
const MIN_CHANGE_SMALLCAP = 6

function getMinThreshold(capCategory: 'largecap' | 'midcap' | 'smallcap'): number {
  switch (capCategory) {
    case 'largecap': return MIN_CHANGE_LARGECAP
    case 'midcap': return MIN_CHANGE_MIDCAP
    case 'smallcap': return MIN_CHANGE_SMALLCAP
  }
}

async function fetchMoversForCategory(
  symbols: string[],
  capCategory: 'largecap' | 'midcap' | 'smallcap'
): Promise<StockMoverData[]> {
  const movers: StockMoverData[] = []
  const minChange = getMinThreshold(capCategory)

  for (const symbol of symbols) {
    try {
      const stock = await fetchGoogleFinanceStock(symbol)
      await delay(350)

      if (!stock) continue
      if (stock.avgVolume <= 0) continue
      if (Math.abs(stock.changePercent) < minChange) continue

      movers.push({
        symbol: stock.symbol,
        companyName: stock.companyName,
        exchange: 'NSE',
        sector: SECTOR_MAP[symbol] || 'Diversified',
        eventType: stock.changePercent > 0 ? 'RISE' : 'FALL',
        changePercent: Math.abs(stock.changePercent),
        changeAmount: Math.abs(stock.change),
        openPrice: stock.prevClose,
        closePrice: stock.price,
        highPrice: stock.dayHigh || stock.price,
        lowPrice: stock.dayLow || stock.price,
        volume: stock.avgVolume,
        avgVolume: stock.avgVolume,
        marketCap: stock.marketCap,
        week52High: stock.yearHigh,
        week52Low: stock.yearLow,
        capCategory,
      })
    } catch (error) {
      console.error(`[stockService] Google Finance failed for ${symbol}:`, error instanceof Error ? error.message : error)
    }
  }

  return movers
}

export async function getNiftyChangePercent(): Promise<number | null> {
  try {
    const gf = await fetchGoogleFinanceQuote('^NSEI')
    if (gf && Number.isFinite(gf.changePercent)) return gf.changePercent
  } catch {}

  try {
    const yahooFinance = await getYahooFinance()
    const quote = await yahooFinance.quote('^NSEI') as Record<string, unknown>
    return (quote?.regularMarketChangePercent as number) ?? null
  } catch {
    return null
  }
}

export async function getStockMovers(): Promise<StockMoverData[]> {
  // Run sequentially to avoid 140 concurrent fetches eating all memory
  const largecap = await fetchMoversForCategory(LARGECAP_STOCKS, 'largecap')
  const midcap = await fetchMoversForCategory(MIDCAP_STOCKS, 'midcap')
  const smallcap = await fetchMoversForCategory(SMALLCAP_STOCKS, 'smallcap')

  console.log(`[stockService] Movers found — largecap: ${largecap.length}, midcap: ${midcap.length}, smallcap: ${smallcap.length}`)

  const allMovers = [...largecap, ...midcap, ...smallcap]

  // Sort by absolute change percent — biggest movers first (most searched)
  allMovers.sort((a, b) => b.changePercent - a.changePercent)

  // Limit to top 20 biggest movers across all categories
  return allMovers.slice(0, 20)
}
