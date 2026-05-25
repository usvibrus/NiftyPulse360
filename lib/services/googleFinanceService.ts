/**
 * Google Finance scraper for Indian indices.
 * No API key needed. Parses the public Google Finance page.
 */

export interface GoogleFinanceQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
}

const GOOGLE_FINANCE_URLS: Record<string, string> = {
  '^NSEI': 'https://www.google.com/finance/quote/NIFTY_50:INDEXNSE',
  '^BSESN': 'https://www.google.com/finance/quote/SENSEX:INDEXBOM',
}

export async function fetchGoogleFinanceQuote(symbol: string): Promise<GoogleFinanceQuote | null> {
  const url = GOOGLE_FINANCE_URLS[symbol]
  if (!url) return null

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      console.warn(`[google-finance] HTTP ${res.status} for ${symbol}`)
      return null
    }

    const html = await res.text()

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
    let changePercent = 0
    if (changeSection) {
      changePercent = parseFloat(changeSection[1].replace(/[,%]/g, ''))
    }

    // Change points - look for pattern like "+312.40" near the percent
    const changePointsMatch = html.match(/class="N6SYTe"[\s\S]{0,500}?([+-][\d,]+\.\d+)/)
    let change = 0
    if (changePointsMatch) {
      change = parseFloat(changePointsMatch[1].replace(/,/g, ''))
    }

    // If we couldn't get change from HTML, calculate from percent
    if (change === 0 && changePercent !== 0) {
      change = price * changePercent / 100
    }

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
