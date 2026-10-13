/**
 * Shared library for fetching filtered NSE stock movers.
 * Called directly by SEO listing pages (server components).
 *
 * Independent of stockService.ts — this lib uses Google Finance directly
 * and never touches the DB. Listing pages = ephemeral, no DB writes.
 */

import { fetchGoogleFinanceStock, GoogleFinanceStock } from '@/lib/services/googleFinanceService'
import { getSectorBySlug } from '@/lib/sectors/sectorUniverse'

const CACHE_TTL_MS = 30 * 60 * 1000 // 30 min — fresher data, less memory pressure
const MAX_CACHE_KEYS = 10           // hard cap. Currently we use 6 keys, so this is headroom
const cache = new Map<string, { data: GoogleFinanceStock[]; ts: number }>()

// Curated NSE universe used for non-sector filters (circuit, 52-week).
const FULL_UNIVERSE = [
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
  'DLF', 'GODREJPROP', 'TVSMOTOR', 'BAJAJ-AUTO', 'LUPIN',
  'TORNTPHARM', 'PERSISTENT', 'COFORGE', 'LTIM', 'ADANIGREEN',
  'TATAPOWER', 'OLECTRA', 'SUZLON',
]

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Scrapes in progress, keyed like the cache. Concurrent requests for the same listing
// page share one crawl instead of each starting its own 60+ page scrape (memory spikes).
const inflight = new Map<string, Promise<GoogleFinanceStock[]>>()

async function fetchUniverse(symbols: string[], cacheKey: string): Promise<GoogleFinanceStock[]> {
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.data

  const pending = inflight.get(cacheKey)
  if (pending) return pending

  const scrape = scrapeUniverse(symbols, cacheKey).finally(() => inflight.delete(cacheKey))
  inflight.set(cacheKey, scrape)
  return scrape
}

async function scrapeUniverse(symbols: string[], cacheKey: string): Promise<GoogleFinanceStock[]> {
  const results: GoogleFinanceStock[] = []
  for (const sym of symbols) {
    try {
      const stock = await fetchGoogleFinanceStock(sym)
      if (stock && stock.price > 0) results.push(stock)
      await delay(300)
    } catch {
      // skip failed symbol
    }
  }

  // Evict oldest entries if we exceed the size cap (insertion order = age in JS Maps)
  while (cache.size >= MAX_CACHE_KEYS) {
    const oldestKey = cache.keys().next().value
    if (oldestKey === undefined) break
    cache.delete(oldestKey)
  }

  cache.set(cacheKey, { data: results, ts: Date.now() })
  return results
}

export interface MoversResult {
  stocks: GoogleFinanceStock[]
  fetchedAt: Date
}

export async function getSectorMovers(sectorSlug: string): Promise<MoversResult> {
  const sector = getSectorBySlug(sectorSlug)
  if (!sector) return { stocks: [], fetchedAt: new Date() }

  // Copy before sorting: the cached array is shared with other requests
  const stocks = [...(await fetchUniverse(sector.symbols, `sector:${sectorSlug}`))]
  // Sort by absolute % change so biggest movers (up or down) come first
  stocks.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
  return { stocks, fetchedAt: new Date() }
}

export async function getUpperCircuitStocks(): Promise<MoversResult> {
  const all = await fetchUniverse(FULL_UNIVERSE, 'full-universe')
  const filtered = all.filter(s => s.changePercent >= 4.5)
  filtered.sort((a, b) => b.changePercent - a.changePercent)
  return { stocks: filtered, fetchedAt: new Date() }
}

export async function getLowerCircuitStocks(): Promise<MoversResult> {
  const all = await fetchUniverse(FULL_UNIVERSE, 'full-universe')
  const filtered = all.filter(s => s.changePercent <= -4.5)
  filtered.sort((a, b) => a.changePercent - b.changePercent)
  return { stocks: filtered, fetchedAt: new Date() }
}

export async function get52WeekHighStocks(): Promise<MoversResult> {
  const all = await fetchUniverse(FULL_UNIVERSE, 'full-universe')
  // Within 1% of 52-week high
  const filtered = all.filter(s => s.yearHigh > 0 && s.price >= s.yearHigh * 0.99)
  filtered.sort((a, b) => (b.price / b.yearHigh) - (a.price / a.yearHigh))
  return { stocks: filtered, fetchedAt: new Date() }
}

export async function get52WeekLowStocks(): Promise<MoversResult> {
  const all = await fetchUniverse(FULL_UNIVERSE, 'full-universe')
  // Within 1% of 52-week low
  const filtered = all.filter(s => s.yearLow > 0 && s.price <= s.yearLow * 1.01)
  filtered.sort((a, b) => (a.price / a.yearLow) - (b.price / b.yearLow))
  return { stocks: filtered, fetchedAt: new Date() }
}
