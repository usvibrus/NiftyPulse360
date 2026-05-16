import { format } from 'date-fns'

function formatDate(date: Date): string {
  return format(date, 'dd MMM yyyy')
}

export function generateStockTitle(
  companyName: string,
  symbol: string,
  eventType: 'RISE' | 'FALL',
  changePercent: number,
  date: Date,
  options?: { newsTrigger?: string; volume?: number; avgVolume?: number; sector?: string }
) {
  const verb = eventType === 'RISE' ? 'Rose' : 'Fell'
  const verbLower = eventType === 'RISE' ? 'rose' : 'fell'
  const d = formatDate(date)
  const sentiment = eventType === 'RISE' ? 'rally' : 'decline'

  // GUIDE Section 6.1: "Why Did [STOCK NAME] ([SYMBOL]) Rise/Fall X% Today? | [DATE] | NiftyPulse360"
  const metaTitle = `Why Did ${companyName} (${symbol}) ${verb} ${changePercent.toFixed(1)}% Today? | ${d}`

  // GUIDE Section 6.2: meta description includes news trigger
  let metaDesc = `${companyName} (${symbol}) ${verbLower} ${changePercent.toFixed(2)}% on ${d}.`
  if (options?.newsTrigger) {
    const trigger = options.newsTrigger.length > 80 ? options.newsTrigger.substring(0, 77) + '...' : options.newsTrigger
    metaDesc += ` Key trigger: ${trigger}.`
  } else {
    metaDesc += ` Find out the key reasons behind today's ${sentiment}.`
  }
  if (options?.volume && options?.avgVolume && options.avgVolume > 0) {
    const ratio = (options.volume / options.avgVolume).toFixed(1)
    metaDesc += ` Volume ${(options.volume / 10000000).toFixed(2)}Cr (${ratio}x avg).`
  }
  if (options?.sector) metaDesc += ` ${options.sector}.`

  // Trim to 160 chars
  if (metaDesc.length > 160) metaDesc = metaDesc.substring(0, 157) + '...'

  const h1 = `Why Did ${companyName} (${symbol}) Share Price ${verb === 'Rose' ? 'Rise' : 'Fall'} ${changePercent.toFixed(2)}% Today?`

  return { metaTitle, h1, metaDesc }
}

export function generateIndexTitle(indexName: string, eventType: 'RISE' | 'FALL', changePoints: number, date: Date) {
  const verb = eventType === 'RISE' ? 'Rose' : 'Fell'
  const d = formatDate(date)
  return {
    metaTitle: `Why ${indexName} ${verb} ${Math.round(changePoints)} Points Today | ${d}`,
    h1: `Why Did ${indexName} ${verb === 'Rose' ? 'Rise' : 'Fall'} ${Math.round(changePoints)} Points Today?`,
    metaDesc: `${indexName} ${verb.toLowerCase()} ${Math.round(changePoints)} points on ${d}. Find out the key reasons behind today's market ${eventType === 'RISE' ? 'rally' : 'fall'} with latest news and analysis.`,
  }
}

export function generateMetalTitle(metal: string, eventType: 'RISE' | 'FALL', changePercent: number, date: Date) {
  const verb = eventType === 'RISE' ? 'Rose' : 'Fell'
  const d = formatDate(date)
  const metalName = metal === 'GOLD' ? 'Gold' : 'Silver'
  return {
    metaTitle: `Why ${metalName} Price ${verb} Today In India | ${d}`,
    h1: `Why Did ${metalName} Price ${verb === 'Rose' ? 'Rise' : 'Fall'} ${changePercent.toFixed(1)}% Today In India?`,
    metaDesc: `${metalName} price ${verb.toLowerCase()} ${changePercent.toFixed(2)}% on ${d} in India. Check latest ${metalName.toLowerCase()} rate per gram, per tola and reasons behind today's price movement.`,
  }
}

export function generateCommodityTitle(commodity: string, eventType: 'RISE' | 'FALL', changePercent: number, date: Date) {
  const verb = eventType === 'RISE' ? 'Rose' : 'Fell'
  const d = formatDate(date)
  const name = commodity.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
  return {
    metaTitle: `Why ${name} Price ${verb} Today | ${d}`,
    h1: `Why Did ${name} Price ${verb === 'Rose' ? 'Rise' : 'Fall'} ${changePercent.toFixed(1)}% Today?`,
    metaDesc: `${name} price ${verb.toLowerCase()} ${changePercent.toFixed(2)}% on ${d}. Find out the reasons behind today's ${name.toLowerCase()} price movement and what experts say.`,
  }
}

export function generateCurrencyTitle(pair: string, eventType: 'RISE' | 'FALL', changePercent: number, date: Date) {
  const verb = eventType === 'RISE' ? 'Rose' : 'Fell'
  const d = formatDate(date)
  const pairName = pair.replace('_', '/')
  return {
    metaTitle: `Why ${pairName} ${verb} Today | ${d}`,
    h1: `Why Did ${pairName} ${verb === 'Rose' ? 'Rise' : 'Fall'} ${changePercent.toFixed(1)}% Today?`,
    metaDesc: `${pairName} exchange rate ${verb.toLowerCase()} ${changePercent.toFixed(2)}% on ${d}. Check latest rate and reasons behind today's currency movement.`,
  }
}
