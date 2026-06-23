/**
 * Gold & Silver rates for India via RapidAPI.
 * Source: gold-silver-rates-india.p.rapidapi.com
 *
 * Set RAPIDAPI_KEY in env. Optionally set RAPIDAPI_METALS_CITY (default: mumbai).
 *
 * Response shape:
 * {
 *   success: true,
 *   data: {
 *     gold: { "22k": { "1gram": 14425, ... }, "24k": { "1gram": 15146, ... } },
 *     silver: { "1gram": 300, "1kg": 300000, ...other noisy fields we ignore }
 *   }
 * }
 *
 * We return only the clean values we care about (per-gram, INR).
 */

const HOST = 'gold-silver-rates-india.p.rapidapi.com'

interface RapidApiMetalsResponse {
  success?: boolean
  data?: {
    gold?: {
      '22k'?: { '1gram'?: number; '8grams'?: number; '10grams'?: number }
      '24k'?: { '1gram'?: number; '8grams'?: number; '10grams'?: number }
    }
    silver?: {
      '1gram'?: number
      '1kg'?: number
      [key: string]: unknown
    }
  }
}

export interface RapidApiMetals {
  gold24k: number     // INR per gram
  gold22k: number     // INR per gram
  silver: number      // INR per gram
  city: string
  fetchedAt: Date
}

async function attemptFetch(url: string, key: string): Promise<RapidApiMetalsResponse | null> {
  const res = await fetch(url, {
    headers: {
      'x-rapidapi-host': HOST,
      'x-rapidapi-key': key,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(12000),
  })

  if (!res.ok) {
    console.warn(`[rapidapi-metals] HTTP ${res.status}`)
    return null
  }

  return res.json() as Promise<RapidApiMetalsResponse>
}

export async function fetchRapidApiMetals(): Promise<RapidApiMetals | null> {
  const key = process.env.RAPIDAPI_KEY
  if (!key) return null

  const city = process.env.RAPIDAPI_METALS_CITY || 'mumbai'
  const url = `https://${HOST}/api/Fetch-Gold-Silver/?city=${encodeURIComponent(city)}`

  let data: RapidApiMetalsResponse | null = null
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      data = await attemptFetch(url, key)
      if (data?.success && data.data) break
      data = null
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn(`[rapidapi-metals] attempt ${attempt + 1} failed: ${msg}`)
      data = null
    }
    if (attempt === 0) await new Promise(r => setTimeout(r, 3000))
  }

  if (!data?.success || !data.data) {
    console.warn('[rapidapi-metals] all attempts failed or success=false')
    return null
  }

  const gold24k = data.data.gold?.['24k']?.['1gram']
  const gold22k = data.data.gold?.['22k']?.['1gram']
  const silver = data.data.silver?.['1gram']

  const validGold = (n: unknown): n is number => typeof n === 'number' && n > 1000 && n < 100000
  const validSilver = (n: unknown): n is number => typeof n === 'number' && n > 50 && n < 10000

  if (!validGold(gold24k) || !validGold(gold22k) || !validSilver(silver)) {
    console.warn(`[rapidapi-metals] invalid values: gold24k=${gold24k}, gold22k=${gold22k}, silver=${silver}`)
    return null
  }

  return {
    gold24k,
    gold22k,
    silver,
    city,
    fetchedAt: new Date(),
  }
}
