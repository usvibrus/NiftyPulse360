/**
 * GoodReturns.in scraper for Gold & Silver prices in India.
 * No API key needed. Parses the public page intro text.
 * Returns prices in INR per gram.
 */

export interface GoodReturnsMetals {
  gold24k: number   // INR per gram
  silver: number    // INR per gram
  goldChange: number
  silverChange: number
}

export async function fetchGoodReturnsMetals(): Promise<GoodReturnsMetals | null> {
  try {
    const [goldHtml, silverHtml] = await Promise.all([
      fetchPage('https://www.goodreturns.in/gold-rates/'),
      fetchPage('https://www.goodreturns.in/silver-rates/'),
    ])

    if (!goldHtml) return null

    // Gold: intro text has "₹15,938 per gram for 24 karat"
    // HTML entities: &#8377; or &#x20b9; = ₹
    const goldMatch = goldHtml.match(/(?:₹|&#8377;|&#x20b9;)\s*([\d,]+)\s*(?:<\/strong>)?\s*per\s*gram\s*for\s*24/i)
    const gold24k = goldMatch ? parseInt(goldMatch[1].replace(/,/g, ''), 10) : 0

    // Gold change: in table as <span class="gr-delta-up">(+32)</span> after ₹15,938
    let goldChange = 0
    const goldChangeMatch = goldHtml.match(/15,?\d{3}[\s\S]{0,200}?class="gr-delta-(?:up|down)">\(([+-]?\d+)\)/)
    if (goldChangeMatch) {
      goldChange = parseInt(goldChangeMatch[1], 10)
    }

    // Silver: intro text has "₹285 per gram"
    let silver = 0
    // The silver page's change value isn't parsed yet, so it is always reported as 0
    const silverChange = 0
    if (silverHtml) {
      const silverMatch = silverHtml.match(/(?:₹|&#8377;|&#x20b9;)\s*([\d,]+)\s*(?:<\/strong>)?\s*per\s*gram/i)
      silver = silverMatch ? parseInt(silverMatch[1].replace(/,/g, ''), 10) : 0
    }

    if (gold24k <= 0) {
      console.warn('[goodreturns] Could not parse gold price')
      return null
    }

    return { gold24k, silver, goldChange, silverChange }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('[goodreturns] fetch failed:', msg)
    return null
  }
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })
    return res.ok ? await res.text() : null
  } catch {
    return null
  }
}
