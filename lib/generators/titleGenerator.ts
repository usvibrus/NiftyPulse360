import { format } from 'date-fns'

function formatDate(date: Date): string {
  return format(date, 'dd MMM yyyy')
}

export function generateStockTitle(companyName: string, symbol: string, eventType: 'RISE' | 'FALL', changePercent: number, date: Date) {
  const verb = eventType === 'RISE' ? 'Rose' : 'Fell'
  const d = formatDate(date)
  return {
    metaTitle: `Why ${companyName} ${verb} ${changePercent.toFixed(1)}% Today | ${d}`,
    h1: `Why Did ${companyName} (${symbol}) Share Price ${verb === 'Rose' ? 'Rise' : 'Fall'} ${changePercent.toFixed(1)}% Today?`,
    metaDesc: `${companyName} (${symbol}) share price ${verb.toLowerCase()} ${changePercent.toFixed(2)}% today on NSE. Find out the key reasons behind today's sharp ${eventType === 'RISE' ? 'rally' : 'decline'} including news, analysis and expert views.`,
  }
}

export function generateIndexTitle(indexName: string, eventType: 'RISE' | 'FALL', changePoints: number, date: Date) {
  const verb = eventType === 'RISE' ? 'Rose' : 'Fell'
  const d = formatDate(date)
  return {
    metaTitle: `Why ${indexName} ${verb} ${Math.round(changePoints)} Points Today | ${d}`,
    h1: `Why Did ${indexName} ${verb === 'Rose' ? 'Rise' : 'Fall'} ${Math.round(changePoints)} Points Today?`,
    metaDesc: `${indexName} ${verb.toLowerCase()} ${Math.round(changePoints)} points today. Find out the key reasons behind today's market ${eventType === 'RISE' ? 'rally' : 'fall'} with latest news and analysis.`,
  }
}

export function generateMetalTitle(metal: string, eventType: 'RISE' | 'FALL', changePercent: number, date: Date) {
  const verb = eventType === 'RISE' ? 'Rose' : 'Fell'
  const d = formatDate(date)
  const metalName = metal === 'GOLD' ? 'Gold' : 'Silver'
  return {
    metaTitle: `Why ${metalName} Price ${verb} Today In India | ${d}`,
    h1: `Why Did ${metalName} Price ${verb === 'Rose' ? 'Rise' : 'Fall'} ${changePercent.toFixed(1)}% Today In India?`,
    metaDesc: `${metalName} price ${verb.toLowerCase()} ${changePercent.toFixed(2)}% today in India. Check latest ${metalName.toLowerCase()} rate per gram, per tola and reasons behind today's price movement.`,
  }
}

export function generateCommodityTitle(commodity: string, eventType: 'RISE' | 'FALL', changePercent: number, date: Date) {
  const verb = eventType === 'RISE' ? 'Rose' : 'Fell'
  const d = formatDate(date)
  const name = commodity.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
  return {
    metaTitle: `Why ${name} Price ${verb} Today | ${d}`,
    h1: `Why Did ${name} Price ${verb === 'Rose' ? 'Rise' : 'Fall'} ${changePercent.toFixed(1)}% Today?`,
    metaDesc: `${name} price ${verb.toLowerCase()} ${changePercent.toFixed(2)}% today. Find out the reasons behind today's ${name.toLowerCase()} price movement and what experts say.`,
  }
}

export function generateCurrencyTitle(pair: string, eventType: 'RISE' | 'FALL', changePercent: number, date: Date) {
  const verb = eventType === 'RISE' ? 'Rose' : 'Fell'
  const d = formatDate(date)
  const pairName = pair.replace('_', '/')
  return {
    metaTitle: `Why ${pairName} ${verb} Today | ${d}`,
    h1: `Why Did ${pairName} ${verb === 'Rose' ? 'Rise' : 'Fall'} ${changePercent.toFixed(1)}% Today?`,
    metaDesc: `${pairName} exchange rate ${verb.toLowerCase()} ${changePercent.toFixed(2)}% today. Check latest rate and reasons behind today's currency movement.`,
  }
}
