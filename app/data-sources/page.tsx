// accessibility: verified
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Data Sources',
  description: 'Primary and secondary data sources NiftyPulse360 uses for stock prices, news, commodities, currencies, and corporate actions.',
  alternates: { canonical: '/data-sources' },
}

export default function DataSourcesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 prose">
      <nav className="text-xs text-[#666] mb-3" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#1565C0]">Home</Link> › <span className="text-[#1A1A1A]">Data Sources</span>
      </nav>
      <h1>Data Sources</h1>
      <p className="text-sm text-[#666]">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <p>NiftyPulse360 sources every numeric and editorial fact on the site from one of the following providers. We list them here for transparency and to comply with attribution requirements.</p>

      <h2>Equities (NSE / BSE)</h2>
      <ul>
        <li><strong><a href="https://www.nseindia.com" rel="noopener noreferrer external" target="_blank">National Stock Exchange of India (NSE)</a></strong> — official open, high, low, close, volume, traded value, sector indices, derivatives data.</li>
        <li><strong><a href="https://www.bseindia.com" rel="noopener noreferrer external" target="_blank">Bombay Stock Exchange (BSE)</a></strong> — Sensex constituents, listed company data, corporate filings.</li>
        <li><strong>Yahoo Finance</strong> — secondary source for 52-week high/low, average volume, sector classification.</li>
      </ul>

      <h2>Indices</h2>
      <ul>
        <li>NSE Indices Limited — Nifty 50, Nifty 200, Bank Nifty, Nifty IT, Nifty Pharma, Nifty Auto, India VIX.</li>
        <li>BSE — Sensex, BSE 500, sectoral indices.</li>
      </ul>

      <h2>Gold &amp; Silver</h2>
      <ul>
        <li><strong><a href="https://metalpriceapi.com" rel="noopener noreferrer external" target="_blank">MetalpriceAPI</a></strong> — primary source for INR-denominated gold (XAU) and silver (XAG) per ounce.</li>
        <li><strong><a href="https://www.goldapi.io" rel="noopener noreferrer external" target="_blank">GoldAPI</a></strong> — fallback source for precious metal pricing.</li>
        <li>Conversion: 1 troy ounce = 31.1035 grams. Tola = 11.66 grams.</li>
      </ul>

      <h2>Commodities</h2>
      <ul>
        <li>Yahoo Finance commodity futures — Crude Oil (CL=F), Brent (BZ=F), Natural Gas (NG=F), Copper (HG=F).</li>
        <li>Multi Commodity Exchange of India (MCX) data where available.</li>
      </ul>

      <h2>Currencies</h2>
      <ul>
        <li><strong>ExchangeRate API</strong> — real-time and historical reference rates for INR pairs.</li>
        <li><strong><a href="https://www.rbi.org.in" rel="noopener noreferrer external" target="_blank">Reserve Bank of India (RBI)</a></strong> — official daily reference rates.</li>
      </ul>

      <h2>News</h2>
      <ul>
        <li><strong>Reuters, PTI (Press Trust of India), Bloomberg</strong> — wire services.</li>
        <li><strong>Moneycontrol, Economic Times, Business Standard, Mint, LiveMint, CNBC-TV18</strong> — Indian financial press.</li>
        <li><strong>Company filings on NSE and BSE</strong> — primary source for corporate disclosures, results, and announcements.</li>
        <li>Google News and aggregator APIs are used for retrieval; the underlying source publisher is always cited.</li>
      </ul>

      <h2>Corporate Actions</h2>
      <ul>
        <li>NSE Corporate Announcements feed.</li>
        <li>BSE Corporate Announcements feed.</li>
        <li>SEBI filings.</li>
      </ul>

      <h2>Macro &amp; Sector Context</h2>
      <ul>
        <li>RBI for monetary policy data.</li>
        <li>Ministry of Statistics and Programme Implementation (MoSPI) for inflation, IIP, GDP releases.</li>
        <li>SEBI for FII/DII flow data.</li>
      </ul>

      <h2>Attribution and Licensing</h2>
      <p>All exchange data is used in compliance with the redistribution terms of NSE and BSE. Where we display third-party news, we link to the original publisher and credit the source by name. We do not republish full articles from paywalled sources; we summarize or excerpt fairly with attribution.</p>

      <h2>Reporting Source Issues</h2>
      <p>If you believe a source is incorrectly cited or attribution is missing, email <a href="mailto:editor@niftypulse360.com">editor@niftypulse360.com</a>.</p>
    </div>
  )
}
