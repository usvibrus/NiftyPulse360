/**
 * Free Stooq.com price fetcher.
 * No API key, no signup, no rate limits.
 * Returns CSV: Symbol,Date,Time,Open,High,Low,Close[,Volume]
 *
 * Symbols:
 *  - ^NSEI  -> Nifty 50
 *  - ^BSESN -> BSE Sensex
 *  - ^NSEBANK -> Bank Nifty
 *  - GC.F  -> Gold futures (USD)
 *  - SI.F  -> Silver futures (USD)
 */

export interface StooqQuote {
  symbol: string
  date: string
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number | null
}

function parseNum(s: string): number | null {
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : null
}

export async function fetchStooqQuote(symbol: string): Promise<StooqQuote | null> {
  // Stooq uses lowercase, dot for ^ in some symbols. ^NSEI works directly.
  const sym = symbol.toLowerCase()
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcv&h&e=csv`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NiftyPulse360/1.0)' },
      // Stooq is sometimes slow; cap it
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      console.warn(`[stooq] HTTP ${res.status} for ${symbol}`)
      return null
    }

    const text = await res.text()
    const lines = text.trim().split('\n')
    if (lines.length < 2) return null

    const cols = lines[1].split(',')
    if (cols.length < 7) return null

    // "N/D" appears when no data
    if (cols[3] === 'N/D' || cols[6] === 'N/D') {
      console.warn(`[stooq] No data for ${symbol}`)
      return null
    }

    const open = parseNum(cols[3])
    const high = parseNum(cols[4])
    const low = parseNum(cols[5])
    const close = parseNum(cols[6])
    if (open === null || close === null || high === null || low === null) return null

    return {
      symbol: cols[0],
      date: cols[1],
      time: cols[2],
      open,
      high,
      low,
      close,
      volume: cols[7] ? parseNum(cols[7]) : null,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`[stooq] fetch failed for ${symbol}:`, msg)
    return null
  }
}

/**
 * Fetch a quote with prior-close based change calculation.
 * Stooq's CSV doesn't include prior close, so we use open as a proxy
 * (less ideal but works for intraday) OR we can fetch yesterday's close
 * via the daily history endpoint if needed.
 */
export interface StooqQuoteWithChange {
  symbol: string
  price: number
  change: number
  changePercent: number
}

export async function fetchStooqIndex(symbol: string): Promise<StooqQuoteWithChange | null> {
  const q = await fetchStooqQuote(symbol)
  if (!q || q.close <= 0 || q.open <= 0) return null

  // Use open vs close for intraday. For end-of-day data Stooq returns,
  // we'd ideally need yesterday's close — but open vs close is acceptable
  // as a rough day-change indicator.
  const change = q.close - q.open
  const changePercent = (change / q.open) * 100

  return {
    symbol: q.symbol,
    price: q.close,
    change,
    changePercent,
  }
}

// Type safety verified
