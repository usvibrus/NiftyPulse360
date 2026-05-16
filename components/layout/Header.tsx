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
    const [indices, metals, commodities, currencies] = await Promise.all([
      prisma.indexEvent.findMany({ orderBy: { eventDate: 'desc' }, take: 3, select: { indexName: true, closeValue: true, changePercent: true, eventType: true } }),
      prisma.metalEvent.findMany({ orderBy: { eventDate: 'desc' }, take: 2, select: { metal: true, carat: true, pricePerGram: true, changePercent: true, eventType: true } }),
      prisma.commodityEvent.findMany({ orderBy: { eventDate: 'desc' }, take: 1, select: { commodity: true, priceUSD: true, changePercent: true, eventType: true } }),
      prisma.currencyEvent.findMany({ orderBy: { eventDate: 'desc' }, take: 1, select: { pair: true, rateValue: true, changePercent: true, eventType: true } }),
    ])
    return { indices, metals, commodities, currencies }
  } catch {
    return { indices: [], metals: [], commodities: [], currencies: [] }
  }
}

export default async function Header() {
  const { indices, metals, commodities, currencies } = await getTickerData()

  const tickerItems: { label: string; value: string; change: string; isRise: boolean }[] = []

  indices.forEach(i => {
    tickerItems.push({ label: i.indexName, value: i.closeValue.toLocaleString('en-IN'), change: `${i.eventType === 'RISE' ? '▲' : '▼'}${i.changePercent.toFixed(2)}%`, isRise: i.eventType === 'RISE' })
  })
  metals.forEach(m => {
    tickerItems.push({ label: `${m.metal} ${m.carat || ''}`, value: `₹${m.pricePerGram.toFixed(0)}/g`, change: `${m.eventType === 'RISE' ? '▲' : '▼'}${m.changePercent.toFixed(2)}%`, isRise: m.eventType === 'RISE' })
  })
  commodities.forEach(c => {
    tickerItems.push({ label: c.commodity.replace('_', ' '), value: `$${c.priceUSD.toFixed(2)}`, change: `${c.eventType === 'RISE' ? '▲' : '▼'}${c.changePercent.toFixed(2)}%`, isRise: c.eventType === 'RISE' })
  })
  currencies.forEach(c => {
    tickerItems.push({ label: c.pair.replace('_', '/'), value: `₹${c.rateValue.toFixed(2)}`, change: `${c.eventType === 'RISE' ? '▲' : '▼'}${c.changePercent.toFixed(2)}%`, isRise: c.eventType === 'RISE' })
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
      {tickerItems.length > 0 && (
        <div className="ticker-bar">
          <div className="ticker-content">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i}>
                {item.label} <span className={item.isRise ? 'text-rise' : 'text-fall'}>{item.value} {item.change}</span>
              </span>
            ))}
          </div>
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
