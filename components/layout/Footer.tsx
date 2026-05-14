import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-white mb-2">Markets</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/stocks">Stocks</Link></li>
              <li><Link href="/indices">Indices</Link></li>
              <li><Link href="/gold">Gold & Silver</Link></li>
              <li><Link href="/commodities">Commodities</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Company</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/disclaimer">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-4 text-sm text-center">
          © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_SITE_NAME || 'NiftyPulse360'}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
