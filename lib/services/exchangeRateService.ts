/**
 * Free metal & currency rates from exchangerate.host (no API key, unlimited)
 * Returns gold (XAU) and silver (XAG) in INR per troy ounce, then converted to per gram.
 *
 * Note: exchangerate.host now requires a free access key. We try without first
 * (legacy free tier still works for many requests), then fall back if it fails.
 */

const TROY_OZ_TO_GRAM = 31.1035

interface ExchangeRateResponse {
  success?: boolean
  rates?: { [key: string]: number }
  base?: string
}

/**
 * Returns gold and silver prices in INR per gram.
 * Uses exchangerate.host: 1 INR = X troy ounces of XAU/XAG.
 * Inverts to get INR per troy ounce, then divides by 31.1035 for per-gram.
 */
export async function fetchExchangeRateMetals(): Promise<{ gold: number; silver: number } | null> {
  const key = process.env.EXCHANGERATE_API_KEY // optional; legacy free tier may work without
  const url = key
    ? `https://api.exchangerate.host/live?access_key=${key}&source=INR&currencies=XAU,XAG`
    : `https://api.exchangerate.host/latest?base=INR&symbols=XAU,XAG`

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!res.ok) return null

    const data = await res.json() as ExchangeRateResponse & { quotes?: { [key: string]: number } }

    // Two possible response shapes depending on plan:
    // Free public: { rates: { XAU: 0.0000007, XAG: 0.00006 } } where 1 INR = X oz
    // Paid plan:   { quotes: { INRXAU: ..., INRXAG: ... } }
    const rates = data.rates || data.quotes
    if (!rates) return null

    const xauKey = rates.XAU !== undefined ? 'XAU' : 'INRXAU'
    const xagKey = rates.XAG !== undefined ? 'XAG' : 'INRXAG'

    const xau = rates[xauKey]
    const xag = rates[xagKey]
    if (typeof xau !== 'number' || typeof xag !== 'number' || xau <= 0 || xag <= 0) return null

    // 1 INR = xau ounces => 1 ounce = 1/xau INR
    const goldPerOunce = 1 / xau
    const silverPerOunce = 1 / xag

    return {
      gold: goldPerOunce / TROY_OZ_TO_GRAM,
      silver: silverPerOunce / TROY_OZ_TO_GRAM,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('[exchangerate] fetch failed:', msg)
    return null
  }
}
