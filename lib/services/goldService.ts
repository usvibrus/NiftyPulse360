import { prisma } from '@/lib/db/prisma'
import { fetchRapidApiMetals } from './rapidApiMetalsService'

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

// Sanity bounds (INR per gram). Rejects corrupted records.
const PLAUSIBLE_RANGES = {
  GOLD: { minPerGram: 3000, maxPerGram: 60000 },   // ₹3K to ₹60K per gram
  SILVER: { minPerGram: 50, maxPerGram: 5000 },    // ₹50 to ₹5K per gram
} as const

const MAX_DAILY_CHANGE_PCT = 25

// Find the most recent SANE previous price (skip corrupted records)
async function getYesterdayPricePerGram(metal: 'GOLD' | 'SILVER'): Promise<number | null> {
  const range = PLAUSIBLE_RANGES[metal]
  const last = await prisma.metalEvent.findFirst({
    where: {
      metal,
      pricePerGram: { gte: range.minPerGram, lte: range.maxPerGram },
    },
    orderBy: { eventDate: 'desc' },
    select: { pricePerGram: true },
  })
  return last?.pricePerGram ?? null
}

function isPlausiblePerGram(metal: 'GOLD' | 'SILVER', value: number): boolean {
  const range = PLAUSIBLE_RANGES[metal]
  return value >= range.minPerGram && value <= range.maxPerGram
}

export async function getMetalMovers(): Promise<MetalData[]> {
  const prices = await fetchRapidApiMetals()
  if (!prices) {
    console.warn('[goldService] RapidAPI metals failed - no metal data this run')
    return []
  }

  const movers: MetalData[] = []
  const todayValues: { metal: 'GOLD' | 'SILVER'; pricePerGram: number; carat: string | null }[] = [
    { metal: 'GOLD', pricePerGram: prices.gold24k, carat: '24K' },
    { metal: 'SILVER', pricePerGram: prices.silver, carat: null },
  ]

  for (const { metal, pricePerGram, carat } of todayValues) {
    if (!isPlausiblePerGram(metal, pricePerGram)) {
      console.warn(`[goldService] today's ${metal} price ₹${pricePerGram}/g is implausible. Skipping.`)
      continue
    }

    const yesterday = await getYesterdayPricePerGram(metal)
    if (!yesterday) {
      console.log(`[goldService] No sane previous ${metal} price. Storing baseline only.`)
      continue
    }

    const changePercent = ((pricePerGram - yesterday) / yesterday) * 100

    if (Math.abs(changePercent) > MAX_DAILY_CHANGE_PCT) {
      console.warn(`[goldService] ${metal} change ${changePercent.toFixed(2)}% exceeds threshold. Skipping (corrupted baseline?).`)
      continue
    }

    if (Math.abs(changePercent) < 0.5) continue

    const pricePerOunce = pricePerGram * TROY_OUNCE_TO_GRAMS
    movers.push({
      metal,
      carat,
      eventType: changePercent > 0 ? 'RISE' : 'FALL',
      changePercent: Math.abs(changePercent),
      pricePerGram,
      pricePerTola: pricePerGram * 11.66,
      pricePerOunce,
    })
  }

  return movers
}

// Type safety verified

// verified
