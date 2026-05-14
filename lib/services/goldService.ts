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

async function getYesterdayPrice(metal: string): Promise<number | null> {
  const last = await prisma.metalEvent.findFirst({
    where: { metal },
    orderBy: { eventDate: 'desc' },
    select: { pricePerOunce: true },
  })
  return last?.pricePerOunce ?? null
}

export async function getMetalMovers(): Promise<MetalData[]> {
  const prices = await fetchMetalPriceAPI() ?? await fetchGoldAPIFallback()
  if (!prices) return []

  const movers: MetalData[] = []

  for (const [metal, pricePerOunce] of [['GOLD', prices.goldINR], ['SILVER', prices.silverINR]] as const) {
    const yesterday = await getYesterdayPrice(metal)
    if (!yesterday) {
      // First run — store price but don't generate page
      console.log(`[goldService] No previous ${metal} price found, skipping page generation`)
      continue
    }

    const changePercent = ((pricePerOunce - yesterday) / yesterday) * 100
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
