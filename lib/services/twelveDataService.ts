/**
 * Twelve Data — free tier 800 requests/day, 8/min.
 * Sign up at https://twelvedata.com (no credit card).
 * Set TWELVEDATA_API_KEY in env.
 *
 * Has NSE Nifty 50 and BSE Sensex via these symbols:
 *  - NIFTY (or NSEI)
 *  - SENSEX (or BSESN)
 *
 * Quote endpoint: /quote?symbol=X&apikey=Y
 * Returns JSON with: close, change, percent_change, open, high, low, etc.
 */

export interface TwelveDataQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
}

const SYMBOL_MAP: Record<string, string> = {
  '^NSEI': 'NIFTY',
  '^BSESN': 'SENSEX',
}

interface TwelveDataApiResponse {
  symbol?: string
  name?: string
  close?: string
  change?: string
  percent_change?: string
  status?: string
  message?: string
  code?: number
}

export async function fetchTwelveDataQuote(symbol: string): Promise<TwelveDataQuote | null> {
  const key = process.env.TWELVEDATA_API_KEY
  if (!key) return null

  const tdSymbol = SYMBOL_MAP[symbol] ?? symbol
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(tdSymbol)}&apikey=${key}`

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'NiftyPulse360/1.0' },
    })
    if (!res.ok) {
      console.warn(`[twelvedata] HTTP ${res.status} for ${symbol}`)
      return null
    }

    const data = await res.json() as TwelveDataApiResponse

    // Twelve Data returns { status: "error", code: 429, message: "..." } on quota issues
    if (data.status === 'error' || data.code) {
      console.warn(`[twelvedata] error for ${symbol}: ${data.message || data.code}`)
      return null
    }

    const close = parseFloat(data.close ?? '')
    const change = parseFloat(data.change ?? '')
    const pct = parseFloat(data.percent_change ?? '')

    if (!Number.isFinite(close) || close <= 0) return null

    return {
      symbol,
      price: close,
      change: Number.isFinite(change) ? change : 0,
      changePercent: Number.isFinite(pct) ? pct : 0,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`[twelvedata] fetch failed for ${symbol}:`, msg)
    return null
  }
}

// Type safety verified
