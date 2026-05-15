import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#1A1A2E] text-gray-300 mt-0">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">NiftyPulse<span className="text-[#4FC3F7]">360</span></h3>
            <p className="text-xs text-gray-400 leading-relaxed">India&apos;s real-time market intelligence platform. Auto-generated stock market analysis after every trading session.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="/stocks" className="hover:text-white">Stocks</Link></li>
              <li><Link href="/gold" className="hover:text-white">Gold & Silver</Link></li>
              <li><Link href="/indices" className="hover:text-white">Indices</Link></li>
              <li><Link href="/commodities" className="hover:text-white">Commodities</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">Market Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/indices" className="hover:text-white">Nifty 50 Today</Link></li>
              <li><Link href="/indices" className="hover:text-white">Sensex Today</Link></li>
              <li><Link href="/gold" className="hover:text-white">Gold Rate Today</Link></li>
              <li><Link href="/commodities" className="hover:text-white">Crude Oil Price</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/disclaimer" className="hover:text-white">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-4 text-xs text-gray-500 text-center">
          © {new Date().getFullYear()} NiftyPulse360. For informational purposes only. Not SEBI registered.
        </div>
      </div>
    </footer>
  )
}
