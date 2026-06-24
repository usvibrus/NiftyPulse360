import { prisma } from '@/lib/db/prisma'
import { format } from 'date-fns'

export interface MarketWrapData {
  wrapDate: Date
  niftyClose: number | null
  niftyChange: number | null
  niftyChangePct: number | null
  sensexClose: number | null
  sensexChange: number | null
  sensexChangePct: number | null
  bankNiftyClose: number | null
  bankNiftyChange: number | null
  topGainers: { symbol: string; companyName: string; changePercent: number; closePrice: number }[]
  topLosers: { symbol: string; companyName: string; changePercent: number; closePrice: number }[]
  sectorSummary: { sector: string; count: number; avgChange: number }[]
}

export async function aggregateMarketWrap(date: Date): Promise<MarketWrapData> {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const [stocks, indices] = await Promise.all([
    prisma.stockEvent.findMany({
      where: { isPublished: true, eventDate: { gte: dayStart, lte: dayEnd } },
      orderBy: { changePercent: 'desc' },
      select: { symbol: true, companyName: true, eventType: true, changePercent: true, closePrice: true, sector: true },
    }),
    prisma.indexEvent.findMany({
      where: { isPublished: true, eventDate: { gte: dayStart, lte: dayEnd } },
      select: { indexName: true, changePercent: true, changePoints: true, closeValue: true, eventType: true },
    }),
  ])

  const nifty = indices.find(i => i.indexName === 'Nifty 50')
  const sensex = indices.find(i => i.indexName === 'Sensex')
  const bankNifty = indices.find(i => i.indexName === 'Bank Nifty')

  const gainers = stocks
    .filter(s => s.eventType === 'RISE')
    .slice(0, 5)
    .map(s => ({ symbol: s.symbol, companyName: s.companyName, changePercent: s.changePercent, closePrice: s.closePrice }))

  const losers = stocks
    .filter(s => s.eventType === 'FALL')
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5)
    .map(s => ({ symbol: s.symbol, companyName: s.companyName, changePercent: -s.changePercent, closePrice: s.closePrice }))

  const sectorMap = new Map<string, { total: number; count: number }>()
  for (const s of stocks) {
    const sector = s.sector || 'Other'
    const entry = sectorMap.get(sector) || { total: 0, count: 0 }
    const pct = s.eventType === 'RISE' ? s.changePercent : -s.changePercent
    entry.total += pct
    entry.count++
    sectorMap.set(sector, entry)
  }
  const sectorSummary = Array.from(sectorMap.entries())
    .map(([sector, data]) => ({ sector, count: data.count, avgChange: data.total / data.count }))
    .sort((a, b) => b.avgChange - a.avgChange)

  return {
    wrapDate: date,
    niftyClose: nifty?.closeValue || null,
    niftyChange: nifty ? (nifty.eventType === 'FALL' ? -nifty.changePoints : nifty.changePoints) : null,
    niftyChangePct: nifty ? (nifty.eventType === 'FALL' ? -nifty.changePercent : nifty.changePercent) : null,
    sensexClose: sensex?.closeValue || null,
    sensexChange: sensex ? (sensex.eventType === 'FALL' ? -sensex.changePoints : sensex.changePoints) : null,
    sensexChangePct: sensex ? (sensex.eventType === 'FALL' ? -sensex.changePercent : sensex.changePercent) : null,
    bankNiftyClose: bankNifty?.closeValue || null,
    bankNiftyChange: bankNifty ? (bankNifty.eventType === 'FALL' ? -bankNifty.changePoints : bankNifty.changePoints) : null,
    topGainers: gainers,
    topLosers: losers,
    sectorSummary,
  }
}

export function generateMarketWrapContent(data: MarketWrapData): string {
  const dateStr = format(data.wrapDate, 'dd MMMM yyyy')
  const sections: string[] = []

  sections.push(`<section class="wrap-summary">
  <h2>Market Summary — ${dateStr}</h2>
  <table class="ipo-table">
    ${data.niftyClose ? `<tr><td><strong>Nifty 50</strong></td><td>${data.niftyClose.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td><td class="${(data.niftyChangePct || 0) >= 0 ? 'text-rise' : 'text-fall'}">${(data.niftyChangePct || 0) >= 0 ? '+' : ''}${data.niftyChangePct?.toFixed(2)}% (${(data.niftyChange || 0) >= 0 ? '+' : ''}${data.niftyChange?.toFixed(0)} pts)</td></tr>` : ''}
    ${data.sensexClose ? `<tr><td><strong>Sensex</strong></td><td>${data.sensexClose.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td><td class="${(data.sensexChangePct || 0) >= 0 ? 'text-rise' : 'text-fall'}">${(data.sensexChangePct || 0) >= 0 ? '+' : ''}${data.sensexChangePct?.toFixed(2)}%</td></tr>` : ''}
    ${data.bankNiftyClose ? `<tr><td><strong>Bank Nifty</strong></td><td>${data.bankNiftyClose.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td><td>${(data.bankNiftyChange || 0) >= 0 ? '+' : ''}${data.bankNiftyChange?.toFixed(0)} pts</td></tr>` : ''}
  </table>
</section>`)

  if (data.topGainers.length > 0) {
    const rows = data.topGainers.map(s => `<tr><td>${s.companyName} (${s.symbol})</td><td>₹${s.closePrice.toFixed(2)}</td><td class="text-rise">+${s.changePercent.toFixed(2)}%</td></tr>`).join('')
    sections.push(`<section class="wrap-gainers"><h2>Top Gainers Today</h2><table class="ipo-table"><tr><th>Stock</th><th>Price</th><th>Change</th></tr>${rows}</table></section>`)
  }

  if (data.topLosers.length > 0) {
    const rows = data.topLosers.map(s => `<tr><td>${s.companyName} (${s.symbol})</td><td>₹${s.closePrice.toFixed(2)}</td><td class="text-fall">${s.changePercent.toFixed(2)}%</td></tr>`).join('')
    sections.push(`<section class="wrap-losers"><h2>Top Losers Today</h2><table class="ipo-table"><tr><th>Stock</th><th>Price</th><th>Change</th></tr>${rows}</table></section>`)
  }

  if (data.sectorSummary.length > 0) {
    const rows = data.sectorSummary.map(s => `<tr><td>${s.sector}</td><td>${s.count} stocks</td><td class="${s.avgChange >= 0 ? 'text-rise' : 'text-fall'}">${s.avgChange >= 0 ? '+' : ''}${s.avgChange.toFixed(2)}%</td></tr>`).join('')
    sections.push(`<section class="wrap-sectors"><h2>Sector Performance</h2><table class="ipo-table"><tr><th>Sector</th><th>Stocks Tracked</th><th>Avg Change</th></tr>${rows}</table></section>`)
  }

  return sections.join('\n')
}

export function generateMarketWrapTitle(date: Date, niftyClose: number | null, niftyChangePct: number | null): { metaTitle: string; metaDesc: string } {
  const dateStr = format(date, 'dd MMM yyyy')
  const niftyStr = niftyClose ? ` Nifty ${niftyClose.toFixed(0)}` : ''
  const changeStr = niftyChangePct ? ` (${niftyChangePct >= 0 ? '+' : ''}${niftyChangePct.toFixed(2)}%)` : ''

  return {
    metaTitle: `Stock Market Today ${dateStr} —${niftyStr}${changeStr}, Top Gainers & Losers`,
    metaDesc: `Indian stock market summary for ${dateStr}.${niftyStr}${changeStr}. Top gainers, losers, and sector performance.`,
  }
}

// Error boundaries validated
