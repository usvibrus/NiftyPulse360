// Component reviewed
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#1A1A2E] text-gray-300 mt-0">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          <div className="col-span-2">
            <h3 className="text-white font-bold text-lg mb-3">NiftyPulse<span className="text-[#4FC3F7]">360</span></h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">India&apos;s real-time market intelligence platform. Daily Indian stock market analysis, news and explanations published by the Markets Desk after every trading session.</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-gray-300">Data sources:</strong> NSE, BSE, RBI, Reuters, PTI, Moneycontrol, Economic Times. Full list at <Link href="/data-sources" className="text-[#4FC3F7] hover:text-white underline">Data Sources</Link>.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="https://x.com/bhamre61968" rel="noopener noreferrer" target="_blank" aria-label="X.com" className="text-gray-400 hover:text-white text-xs">X.com</a>
              <a href="https://www.linkedin.com/in/ankit-bhamre-a82b58343/" rel="noopener noreferrer" target="_blank" aria-label="NiftyPulse360 on LinkedIn" className="text-gray-400 hover:text-white text-xs">LinkedIn</a>
              <Link href="/feed.xml" className="text-gray-400 hover:text-white text-xs">RSS</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">Markets</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/stocks" className="hover:text-white">Stocks</Link></li>
              <li><Link href="/stocks/top-gainers-today" className="hover:text-white">Top Gainers</Link></li>
              <li><Link href="/stocks/top-losers-today" className="hover:text-white">Top Losers</Link></li>
              <li><Link href="/indices" className="hover:text-white">Indices</Link></li>
              <li><Link href="/gold" className="hover:text-white">Gold &amp; Silver</Link></li>
              <li><Link href="/commodities" className="hover:text-white">Commodities</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">Editorial</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/editorial-guidelines" className="hover:text-white">Editorial Guidelines</Link></li>
              <li><Link href="/methodology" className="hover:text-white">Methodology</Link></li>
              <li><Link href="/corrections-policy" className="hover:text-white">Corrections Policy</Link></li>
              <li><Link href="/data-sources" className="hover:text-white">Data Sources</Link></li>
              <li><Link href="/authors/market-desk" className="hover:text-white">Authors</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/disclaimer" className="hover:text-white">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-4 text-xs text-gray-500 text-center space-y-1">
          <p>© {new Date().getFullYear()} NiftyPulse360. For informational purposes only. <strong>Not SEBI registered.</strong> Nothing on this site is investment advice. Consult a SEBI-registered investment advisor before making decisions.</p>
          <p>Editorial: <a href="mailto:editor@niftypulse360.com" className="hover:text-white">editor@niftypulse360.com</a> · Corrections: <a href="mailto:corrections@niftypulse360.com" className="hover:text-white">corrections@niftypulse360.com</a></p>
        </div>
      </div>
    </footer>
  )
}
