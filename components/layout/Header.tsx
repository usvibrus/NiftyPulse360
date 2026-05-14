import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/stocks', label: 'Stocks' },
  { href: '/indices', label: 'Indices' },
  { href: '/gold', label: 'Gold & Silver' },
  { href: '/commodities', label: 'Commodities' },
]

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-700">
          {process.env.NEXT_PUBLIC_SITE_NAME || 'NiftyPulse360'}
        </Link>
        <nav className="hidden md:flex gap-6">
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} className="text-gray-600 hover:text-blue-700 text-sm font-medium">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
