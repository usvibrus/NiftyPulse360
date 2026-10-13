/**
 * Google Finance scraper for Indian indices.
 * No API key needed. Parses the public Google Finance page.
 */

// Standard fetch helper. Google Finance pages are ~1 MB and most of the data
// we parse lives in the last 25%, so partial-body reads don't help here.
// Memory savings come from: (1) bounded cache in moversLib, (2) explicit GC
// of the html string by scoping it tightly inside each fetch function.
async function fetchHtml(url: string, signal: AbortSignal): Promise<string | null> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal,
  })
  if (!res.ok) {
    // Release the unread error body; undici otherwise holds the socket and buffer until GC,
    // which adds up across ~140 symbols per run when Google throttles us.
    await res.body?.cancel().catch(() => {})
    return null
  }
  return await res.text()
}

export interface GoogleFinanceQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
}

export interface GoogleFinanceIndex extends GoogleFinanceQuote {
  open: number
  high: number
  low: number
  prevClose: number
}

export interface GoogleFinanceStock {
  symbol: string
  companyName: string
  price: number
  change: number
  changePercent: number
  prevClose: number
  dayHigh: number
  dayLow: number
  yearHigh: number
  yearLow: number
  avgVolume: number
  marketCap: number
}

const GOOGLE_FINANCE_URLS: Record<string, string> = {
  '^NSEI': 'https://www.google.com/finance/quote/NIFTY_50:INDEXNSE',
  '^BSESN': 'https://www.google.com/finance/quote/SENSEX:INDEXBOM',
  '^NSEBANK': 'https://www.google.com/finance/quote/NIFTY_BANK:INDEXNSE',
  '^CNXIT': 'https://www.google.com/finance/quote/NIFTY_IT:INDEXNSE',
  '^CNXPHARMA': 'https://www.google.com/finance/quote/NIFTY_PHARMA:INDEXNSE',
}

export async function fetchGoogleFinanceQuote(symbol: string): Promise<GoogleFinanceQuote | null> {
  const url = GOOGLE_FINANCE_URLS[symbol]
  if (!url) return null

  try {
    const html = await fetchHtml(url, AbortSignal.timeout(10000))
    if (!html) {
      console.warn(`[google-finance] empty/failed response for ${symbol}`)
      return null
    }

    // Price is in: <div class="N6SYTe"><span ...><span>24,031.70</span></span></div>
    const priceMatch = html.match(/class="N6SYTe"[^>]*>[\s\S]*?<span>([\d,]+\.?\d*)<\/span>/)
    if (!priceMatch) {
      console.warn(`[google-finance] Could not parse price for ${symbol}`)
      return null
    }

    const price = parseFloat(priceMatch[1].replace(/,/g, ''))
    if (!Number.isFinite(price) || price <= 0) return null

    // Change percent is in text like "+1.32%" or "-0.45%"
    const changeSection = html.match(/class="N6SYTe"[\s\S]{0,500}?([+-][\d,.]+%)/)
    const changePercent = changeSection ? parseFloat(changeSection[1].replace(/[,%]/g, '')) : 0

    // Change points - look for pattern like "+312.40" near the percent
    // Negative lookahead so "+1.32" inside "+1.32%" isn't mistaken for the points change
    const changePointsMatch = html.match(/class="N6SYTe"[\s\S]{0,500}?([+-][\d,]+\.\d+)(?![\d.%])/)
    let change = changePointsMatch ? parseFloat(changePointsMatch[1].replace(/,/g, '')) : 0
    if (change === 0 && changePercent !== 0) change = price * changePercent / 100

    // (html string can now be GC'd as soon as this function returns)
    return {
      symbol,
      price,
      change: Number.isFinite(change) ? change : 0,
      changePercent: Number.isFinite(changePercent) ? changePercent : 0,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`[google-finance] fetch failed for ${symbol}:`, msg)
    return null
  }
}



// Helper: parse "18.49T" -> 18,490,000,000,000 etc.
function parseAbbreviatedNumber(s: string): number {
  const cleaned = s.replace(/[,\s]/g, '').toUpperCase()
  const m = cleaned.match(/^([\d.]+)([TBMK]?)$/)
  if (!m) return 0
  const num = parseFloat(m[1])
  if (!Number.isFinite(num)) return 0
  const mult: Record<string, number> = { T: 1e12, B: 1e9, M: 1e6, K: 1e3, '': 1 }
  // Whole numbers only: "2.03M" * 1e6 is 2029999.9999999998, and volumes end up in BigInt columns
  return Math.round(num * (mult[m[2]] ?? 1))
}

function parseNumber(s: string): number {
  const n = parseFloat(s.replace(/[,₹$\s]/g, ''))
  return Number.isFinite(n) ? n : 0
}

// Google Finance HTML-escapes text ("Mahindra &amp; Mahindra Ltd"). Decode before the name
// flows into slugs, page titles, news queries and social posts.
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

/**
 * Fetch individual NSE stock data from Google Finance.
 * URL pattern: https://www.google.com/finance/quote/{SYMBOL}:NSE
 */
export async function fetchGoogleFinanceStock(symbol: string): Promise<GoogleFinanceStock | null> {
  const url = `https://www.google.com/finance/quote/${encodeURIComponent(symbol)}:NSE`

  try {
    const html = await fetchHtml(url, AbortSignal.timeout(10000))
    if (!html) {
      console.warn(`[google-finance-stock] empty/failed response for ${symbol}`)
      return null
    }

    // Price: <div class="N6SYTe">...<span>₹1,366.40</span>
    const priceMatch = html.match(/class="N6SYTe"[^>]*>[\s\S]*?<span>₹?\s*([\d,]+\.?\d*)<\/span>/)
    if (!priceMatch) return null
    const price = parseNumber(priceMatch[1])
    if (price <= 0) return null

    // Company name: <div class="gO24Ff">Reliance Industries Ltd</div> (appears multiple times, second is the page header)
    const nameMatches = [...html.matchAll(/class="gO24Ff"[^>]*>([^<]+)</g)]
    let companyName = symbol
    if (nameMatches.length >= 2) companyName = decodeHtmlEntities(nameMatches[1][1]).trim()
    else if (nameMatches.length >= 1) companyName = decodeHtmlEntities(nameMatches[0][1]).trim()

    // Change percent
    const pctMatch = html.match(/class="N6SYTe"[\s\S]{0,500}?([+-][\d,.]+)%/)
    const changePercent = pctMatch ? parseFloat(pctMatch[1].replace(/,/g, '')) : 0

    // Stats are in: <div class="SwQK7">{LABEL}</div><div class="dO6ijd">{VALUE}</div>
    const stats: Record<string, string> = {}
    const statMatches = [...html.matchAll(/class="SwQK7">([^<]+)<\/div><div class="dO6ijd">([^<]+)</g)]
    for (const m of statMatches) {
      stats[m[1].trim()] = m[2].trim()
    }

    const open = parseNumber(stats['Open'] || '')
    const dayHigh = parseNumber(stats['High'] || '')
    const dayLow = parseNumber(stats['Low'] || '')
    const yearHigh = parseNumber(stats['52-wk high'] || '')
    const yearLow = parseNumber(stats['52-wk low'] || '')
    const avgVolume = parseAbbreviatedNumber(stats['Avg. vol.'] || '')
    const marketCap = parseAbbreviatedNumber(stats['Mkt. cap'] || '')

    // Calculate change from percent
    const change = changePercent !== 0 ? price * changePercent / 100 : 0
    // Use open as proxy for prev close (close enough for our purposes)
    const prevClose = open > 0 ? open : price - change

    // (html string is GC'd as soon as we return — only the small parsed object lives on)
    return {
      symbol,
      companyName,
      price,
      change,
      changePercent,
      prevClose,
      dayHigh,
      dayLow,
      yearHigh,
      yearLow,
      avgVolume,
      marketCap,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`[google-finance-stock] fetch failed for ${symbol}:`, msg)
    return null
  }
}


/**
 * Fetch index quote with extended data (open, high, low, prev close).
 * Falls back to fetchGoogleFinanceQuote if extended fields aren't available.
 */
export async function fetchGoogleFinanceIndex(symbol: string): Promise<GoogleFinanceIndex | null> {
  const url = GOOGLE_FINANCE_URLS[symbol]
  if (!url) return null

  try {
    const html = await fetchHtml(url, AbortSignal.timeout(10000))
    if (!html) return null

    // Price
    const priceMatch = html.match(/class="N6SYTe"[^>]*>[\s\S]*?<span>₹?\s*([\d,]+\.?\d*)<\/span>/)
    if (!priceMatch) return null
    const price = parseNumber(priceMatch[1])
    if (price <= 0) return null

    // Change percent
    const pctMatch = html.match(/class="N6SYTe"[\s\S]{0,500}?([+-][\d,.]+)%/)
    const changePercent = pctMatch ? parseFloat(pctMatch[1].replace(/,/g, '')) : 0

    // Change points
    const chgMatch = html.match(/class="N6SYTe"[\s\S]{0,500}?([+-][\d,]+\.\d+)(?![\d.%])/)
    let change = 0
    if (chgMatch) {
      change = parseNumber(chgMatch[1])
      if (chgMatch[1].startsWith('-')) change = -Math.abs(change)
    }
    if (change === 0 && changePercent !== 0) change = price * changePercent / 100

    // Stats: open, high, low
    const stats: Record<string, string> = {}
    const statMatches = [...html.matchAll(/class="SwQK7">([^<]+)<\/div><div class="dO6ijd">([^<]+)</g)]
    for (const m of statMatches) stats[m[1].trim()] = m[2].trim()

    const open = parseNumber(stats['Open'] || '')
    const high = parseNumber(stats['High'] || '')
    const low = parseNumber(stats['Low'] || '')
    const prevClose = open > 0 ? open : price - change

    return {
      symbol,
      price,
      change,
      changePercent,
      open: open || price,
      high: high || price,
      low: low || price,
      prevClose,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`[google-finance-index] fetch failed for ${symbol}:`, msg)
    return null
  }
}
