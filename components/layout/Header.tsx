import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/stocks', label: 'Stocks' },
  { href: '/indices', label: 'Indices' },
  { href: '/gold', label: 'Gold & Silver' },
  { href: '/commodities', label: 'Commodities' },
]

function TickerBar() {
  return (
    <div className="ticker-bar">
      <div className="ticker-content">
        <span>NIFTY 50 <span className="text-rise">21,456 ▲+0.43%</span></span>
        <span>|</span>
        <span>SENSEX <span className="text-rise">70,234 ▲+0.38%</span></span>
        <span>|</span>
        <span>BANK NIFTY <span className="text-rise">46,789 ▲+0.26%</span></span>
        <span>|</span>
        <span>GOLD 24K <span className="text-rise">₹7,230/g ▲+0.2%</span></span>
        <span>|</span>
        <span>SILVER <span className="text-fall">₹89/g ▼-0.1%</span></span>
        <span>|</span>
        <span>USD/INR <span className="text-fall">₹83.45 ▼-0.05%</span></span>
        <span>|</span>
        <span>CRUDE OIL <span className="text-rise">$82.3 ▲+1.2%</span></span>
        <span>|</span>
        <span>NIFTY 50 <span className="text-rise">21,456 ▲+0.43%</span></span>
        <span>|</span>
        <span>SENSEX <span className="text-rise">70,234 ▲+0.38%</span></span>
        <span>|</span>
        <span>BANK NIFTY <span className="text-rise">46,789 ▲+0.26%</span></span>
        <span>|</span>
        <span>GOLD 24K <span className="text-rise">₹7,230/g ▲+0.2%</span></span>
        <span>|</span>
        <span>SILVER <span className="text-fall">₹89/g ▼-0.1%</span></span>
        <span>|</span>
        <span>USD/INR <span className="text-fall">₹83.45 ▼-0.05%</span></span>
        <span>|</span>
        <span>CRUDE OIL <span className="text-rise">$82.3 ▲+1.2%</span></span>
      </div>
    </div>
  )
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#0D1B2A] h-9 flex items-center justify-between px-4">
        <Link href="/" className="text-white font-bold text-lg">
          NiftyPulse<span className="text-[#4FC3F7]">360</span>
          <span className="text-[#999] text-xs ml-2 hidden sm:inline">India&apos;s Market Intelligence</span>
        </Link>
      </div>
      <TickerBar />
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
