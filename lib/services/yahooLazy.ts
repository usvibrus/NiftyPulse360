/**
 * Lightweight Yahoo Finance REST client — replaces the yahoo-finance2 SDK.
 *
 * Uses the v8 chart API (the v6/quote endpoint was killed mid-2025).
 * No cookies, no module-scope state, no memory growth.
 */

const YF_BASE = 'https://query2.finance.yahoo.com'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'application/json',
}

async function yfFetch(path: string): Promise<unknown> {
  const res = await fetch(`${YF_BASE}${path}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) {
    throw new Error(`Yahoo Finance HTTP ${res.status}: ${path}`)
  }
  return res.json()
}

interface YFClient {
  quote: (symbol: string) => Promise<unknown>
  quoteSummary: (symbol: string, opts: { modules: string[] }) => Promise<unknown>
}

export async function getYahooFinance(): Promise<YFClient> {
  return {
    async quote(symbol: string): Promise<unknown> {
      const data = await yfFetch(
        `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d&includePrePost=false`
      ) as {
        chart?: { result?: Array<{
          meta?: {
            regularMarketPrice?: number
            previousClose?: number
            chartPreviousClose?: number
            [key: string]: unknown
          }
          indicators?: {
            quote?: Array<{
              open?: (number | null)[]
              high?: (number | null)[]
              low?: (number | null)[]
              close?: (number | null)[]
            }>
          }
        }> }
      }

      const result = data?.chart?.result?.[0]
      if (!result?.meta) return null

      const meta = result.meta
      const quotes = result.indicators?.quote?.[0]
      const lastIdx = quotes?.close ? quotes.close.length - 1 : -1

      const price = meta.regularMarketPrice ?? 0
      // With range=2d, chartPreviousClose is the close *before* the first bar (two sessions
      // back), so fall back to the previous daily bar's close to get today's change.
      const closes = quotes?.close ?? []
      const prevBarClose = closes.length >= 2 ? closes[closes.length - 2] : null
      const prevClose = meta.previousClose ?? prevBarClose ?? meta.chartPreviousClose ?? 0
      const change = price - prevClose
      const changePct = prevClose ? (change / prevClose) * 100 : 0

      return {
        regularMarketPrice: price,
        regularMarketChange: change,
        regularMarketChangePercent: changePct,
        regularMarketOpen: (lastIdx >= 0 ? quotes?.open?.[lastIdx] : null) ?? price,
        regularMarketDayHigh: (lastIdx >= 0 ? quotes?.high?.[lastIdx] : null) ?? price,
        regularMarketDayLow: (lastIdx >= 0 ? quotes?.low?.[lastIdx] : null) ?? price,
      }
    },

    async quoteSummary(symbol: string, opts: { modules: string[] }): Promise<unknown> {
      const modules = opts.modules.join(',')
      const data = await yfFetch(`/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`) as {
        quoteSummary?: { result?: Array<Record<string, unknown>> }
      }
      const result = data?.quoteSummary?.result?.[0]
      return result || {}
    },
  }
}
