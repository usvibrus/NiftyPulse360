import axios from 'axios'
import { prisma } from '@/lib/db/prisma'

export interface MetalData {
  metal: 'GOLD' | 'SILVER'
  carat: string | null
  eventType: 'RISE' | 'FALL'
  changePercent: number
  pricePerGram: number
  pricePerTola: number
  pricePerOunce: number
}

const TROY_OUNCE_TO_GRAMS = 31.1035

// Sanity bounds (INR per troy ounce). Real values: gold ~₹4-7L/oz, silver ~₹70-150K/oz.
// Anything outside these ranges is corrupted data — refuse to use it.
const PLAUSIBLE_RANGES = {
  GOLD: { min: 100000, max: 2000000 },   // ₹1L to ₹20L per ounce
  SILVER: { min: 10000, max: 500000 },   // ₹10K to ₹5L per ounce
} as const

const MAX_DAILY_CHANGE_PCT = 25 // gold/silver almost never move >25% in a day

async function fetchMetalPriceAPI(): Promise<{ goldINR: number; silverINR: number } | null> {
  try {
    const res = await axios.get('https://api.metalpriceapi.com/v1/latest', {
      params: { api_key: process.env.METALPRICE_API_KEY, base: 'INR', currencies: 'XAU,XAG' },
    })
    // API returns rates as 1 INR = X ounces, so invert
    const goldPerOunce = 1 / res.data.rates.INRXAU
    const silverPerOunce = 1 / res.data.rates.INRXAG
    return { goldINR: goldPerOunce, silverINR: silverPerOunce }
  } catch (error) {
    console.error('[goldService] MetalpriceAPI failed:', error)
    return null
  }
}

async function fetchGoldAPIFallback(): Promise<{ goldINR: number; silverINR: number } | null> {
  try {
    const [goldRes, silverRes] = await Promise.all([
      axios.get('https://www.goldapi.io/api/XAU/INR', { headers: { 'x-access-token': process.env.GOLD_API_KEY } }),
      axios.get('https://www.goldapi.io/api/XAG/INR', { headers: { 'x-access-token': process.env.GOLD_API_KEY } }),
    ])
    return { goldINR: goldRes.data.price, silverINR: silverRes.data.price }
  } catch (error) {
    console.error('[goldService] Gold-API fallback failed:', error)
    return null
  }
}

// Find the most recent SANE previous price (skip corrupted records)
async function getYesterdayPrice(metal: 'GOLD' | 'SILVER'): Promise<number | null> {
  const range = PLAUSIBLE_RANGES[metal]
  const last = await prisma.metalEvent.findFirst({
    where: {
      metal,
      pricePerOunce: { gte: range.min, lte: range.max },
    },
    orderBy: { eventDate: 'desc' },
    select: { pricePerOunce: true },
  })
  return last?.pricePerOunce ?? null
}

function isPlausiblePrice(metal: 'GOLD' | 'SILVER', pricePerOunce: number): boolean {
  const range = PLAUSIBLE_RANGES[metal]
  return pricePerOunce >= range.min && pricePerOunce <= range.max
}

export async function getMetalMovers(): Promise<MetalData[]> {
  const prices = await fetchMetalPriceAPI() ?? await fetchGoldAPIFallback()
  if (!prices) return []

  const movers: MetalData[] = []

  for (const [metal, pricePerOunce] of [['GOLD', prices.goldINR], ['SILVER', prices.silverINR]] as const) {
    // GUARD 1: today's price must itself be plausible
    if (!isPlausiblePrice(metal, pricePerOunce)) {
      console.warn(`[goldService] Today's ${metal} price ₹${pricePerOunce.toFixed(2)}/oz is outside plausible range. Skipping.`)
      continue
    }

    const yesterday = await getYesterdayPrice(metal)
    if (!yesterday) {
      // First run — store baseline only, don't generate movement page
      console.log(`[goldService] No sane previous ${metal} price found. Storing baseline only.`)
      continue
    }

    const changePercent = ((pricePerOunce - yesterday) / yesterday) * 100

    // GUARD 2: ignore implausibly large daily moves (data corruption indicator)
    if (Math.abs(changePercent) > MAX_DAILY_CHANGE_PCT) {
      console.warn(`[goldService] ${metal} daily change ${changePercent.toFixed(2)}% exceeds ${MAX_DAILY_CHANGE_PCT}% threshold. Skipping (likely corrupted baseline).`)
      continue
    }

    if (Math.abs(changePercent) < 0.5) continue

    const pricePerGram = pricePerOunce / TROY_OUNCE_TO_GRAMS
    movers.push({
      metal,
      carat: metal === 'GOLD' ? '24K' : null,
      eventType: changePercent > 0 ? 'RISE' : 'FALL',
      changePercent: Math.abs(changePercent),
      pricePerGram,
      pricePerTola: pricePerGram * 11.66,
      pricePerOunce,
    })
  }

  return movers
}
