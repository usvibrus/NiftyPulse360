import slugify from 'slugify'
import { todayIST } from '@/lib/utils/dateUtils'

function makeSlug(text: string): string {
  return slugify(text, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g })
}

export function generateStockSlug(companyName: string, eventType: 'RISE' | 'FALL', changePercent: number, date?: string): string {
  const d = date || todayIST()
  const verb = eventType === 'RISE' ? 'rose' : 'fell'
  const pct = Math.round(changePercent)
  return `why-${makeSlug(companyName)}-share-price-${verb}-${pct}percent-today-${d}`
}

export function generateIndexSlug(indexName: string, eventType: 'RISE' | 'FALL', changePoints: number, date?: string): string {
  const d = date || todayIST()
  const verb = eventType === 'RISE' ? 'rose' : 'fell'
  const pts = Math.round(changePoints)
  return `why-${makeSlug(indexName)}-${verb}-${pts}points-today-${d}`
}

export function generateMetalSlug(metal: string, eventType: 'RISE' | 'FALL', date?: string): string {
  const d = date || todayIST()
  const verb = eventType === 'RISE' ? 'rose' : 'fell'
  return `why-${metal.toLowerCase()}-price-${verb}-today-${d}`
}

export function generateCommoditySlug(commodity: string, eventType: 'RISE' | 'FALL', date?: string): string {
  const d = date || todayIST()
  const verb = eventType === 'RISE' ? 'rose' : 'fell'
  return `why-${makeSlug(commodity.replace('_', ' '))}-price-${verb}-today-${d}`
}

export function generateCurrencySlug(pair: string, eventType: 'RISE' | 'FALL', date?: string): string {
  const d = date || todayIST()
  const verb = eventType === 'RISE' ? 'rose' : 'fell'
  return `why-${makeSlug(pair.replace('_', '-'))}-${verb}-today-${d}`
}
