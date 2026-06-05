/**
 * Lightweight Yahoo Finance REST client — replaces the yahoo-finance2 SDK.
 *
 * The SDK adds ~50-80 MB to process memory because it caches modules, maintains
 * a tough-cookie jar, and bundles dozens of unused sub-modules. This file does
 * the same two things we actually use (quote, quoteSummary) via direct HTTP
 * calls to Yahoo's public v6/v10 API. No cookies, no module-scope state, no
 * memory growth.
 */

const YF_BASE = 'https://query2.finance.yahoo.com'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
      const data = await yfFetch(`/v6/finance/quote?symbols=${encodeURIComponent(symbol)}`) as {
        quoteResponse?: { result?: unknown[] }
      }
      const result = data?.quoteResponse?.result?.[0]
      return result || null
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
