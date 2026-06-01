import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/stocks', label: 'Stocks' },
  { href: '/indices', label: 'Indices' },
  { href: '/gold', label: 'Gold & Silver' },
  { href: '/commodities', label: 'Commodities' },
]

async function getTickerData() {
  try {
    const [indices, metals, commodities, currencies, stocks] = await Promise.all([
      prisma.indexEvent.findMany({ orderBy: { eventDate: 'desc' }, take: 3, select: { indexName: true, closeValue: true, changePercent: true, eventType: true } }),
      prisma.metalEvent.findMany({ orderBy: { eventDate: 'desc' }, take: 2, select: { metal: true, carat: true, pricePerGram: true, changePercent: true, eventType: true } }),
      prisma.commodityEvent.findMany({ orderBy: { eventDate: 'desc' }, take: 1, select: { commodity: true, priceUSD: true, changePercent: true, eventType: true } }),
      prisma.currencyEvent.findMany({ orderBy: { eventDate: 'desc' }, take: 1, select: { pair: true, rateValue: true, changePercent: true, eventType: true } }),
      prisma.stockEvent.findMany({ orderBy: { publishedAt: 'desc' }, take: 6, select: { symbol: true, closePrice: true, changePercent: true, eventType: true } }),
    ])
    return { indices, metals, commodities, currencies, stocks }
  } catch {
    return { indices: [], metals: [], commodities: [], currencies: [], stocks: [] }
  }
}

export default async function Header() {
  const { indices, metals, commodities, currencies, stocks } = await getTickerData()

  // Defensive filter: reject any row with insane changePercent (corrupt DB values)
  // No real Indian market instrument moves more than ~25% in a day; >50% is corruption.
  const sanePct = (n: number) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 50

  const tickerItems: { label: string; value: string; change: string; isRise: boolean }[] = []

  indices.filter(i => sanePct(i.changePercent)).forEach(i => {
    tickerItems.push({ label: i.indexName, value: i.closeValue.toLocaleString('en-IN'), change: `${i.eventType === 'RISE' ? '▲' : '▼'}${i.changePercent.toFixed(2)}%`, isRise: i.eventType === 'RISE' })
  })
  metals.filter(m => sanePct(m.changePercent) && m.pricePerGram > 0 && m.pricePerGram < 100000).forEach(m => {
    tickerItems.push({ label: `${m.metal} ${m.carat || ''}`, value: `₹${m.pricePerGram.toFixed(0)}/g`, change: `${m.eventType === 'RISE' ? '▲' : '▼'}${m.changePercent.toFixed(2)}%`, isRise: m.eventType === 'RISE' })
  })
  commodities.filter(c => sanePct(c.changePercent)).forEach(c => {
    tickerItems.push({ label: c.commodity.replace('_', ' '), value: `$${c.priceUSD.toFixed(2)}`, change: `${c.eventType === 'RISE' ? '▲' : '▼'}${c.changePercent.toFixed(2)}%`, isRise: c.eventType === 'RISE' })
  })
  currencies.filter(c => sanePct(c.changePercent)).forEach(c => {
    tickerItems.push({ label: c.pair.replace('_', '/'), value: `₹${c.rateValue.toFixed(2)}`, change: `${c.eventType === 'RISE' ? '▲' : '▼'}${c.changePercent.toFixed(2)}%`, isRise: c.eventType === 'RISE' })
  })
  stocks.filter(s => sanePct(s.changePercent)).forEach(s => {
    tickerItems.push({ label: s.symbol, value: `₹${s.closePrice.toFixed(0)}`, change: `${s.eventType === 'RISE' ? '▲' : '▼'}${s.changePercent.toFixed(2)}%`, isRise: s.eventType === 'RISE' })
  })

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#0D1B2A] h-9 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/icon.svg" alt="NiftyPulse360" className="h-7 rounded-md" />
          <div className="flex flex-col">
            <span className="text-white font-bold text-base leading-tight">NiftyPulse<span className="text-[#4FC3F7]">360</span></span>
            <span className="text-[#7a8a9e] text-[9px] tracking-[0.2em] uppercase leading-tight">Market Intelligence</span>
          </div>
        </Link>
      </div>
      {tickerItems.length > 0 ? (
        <div className="ticker-bar">
          <div className="ticker-content">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i}>
                {item.label} <span className={item.isRise ? 'text-rise' : 'text-fall'}>{item.value} {item.change}</span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="ticker-bar flex items-center justify-center">
          <span className="text-[#7a8a9e] text-xs">Market data loading...</span>
        </div>
      )}
      <nav className="bg-white border-b border-[#E0E0E0] h-11 flex items-center px-4 gap-6 overflow-x-auto">
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href} className="text-[#1A1A1A] hover:text-[#1565C0] text-sm font-semibold whitespace-nowrap">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
