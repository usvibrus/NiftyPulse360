import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Editorial Guidelines',
  description: 'How NiftyPulse360 sources, generates, fact-checks and publishes Indian stock market news and analysis.',
  alternates: { canonical: '/editorial-guidelines' },
}

export default function EditorialGuidelinesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 prose">
      <nav className="text-xs text-[#666] mb-3" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#1565C0]">Home</Link> › <span className="text-[#1A1A1A]">Editorial Guidelines</span>
      </nav>
      <h1>Editorial Guidelines</h1>
      <p className="text-sm text-[#666]">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <h2>Our Mission</h2>
      <p>NiftyPulse360 publishes timely, data-driven explanations of Indian stock market movements. Our goal is to help retail investors and traders quickly understand <em>why</em> a stock, index, commodity, or currency moved on a given trading day — backed by real data and credible news sources.</p>

      <h2>Editorial Standards</h2>
      <ul>
        <li><strong>Accuracy first.</strong> Every numeric claim (price, change, volume, 52-week range) is sourced from official exchange data (NSE, BSE) or reputable market data providers.</li>
        <li><strong>News verification.</strong> News-driven explanations cite at least one named source from the last 48 hours. We do not publish speculative narratives without supporting reporting.</li>
        <li><strong>Independence.</strong> We do not accept payment to cover specific stocks or to bias coverage. We are not SEBI-registered investment advisors and provide no buy/sell recommendations.</li>
        <li><strong>Transparency.</strong> When AI tools are used to draft analysis, this is disclosed on the page and on this site.</li>
      </ul>

      <h2>How Pages Are Created</h2>
      <ol>
        <li><strong>Data ingestion.</strong> After every Indian trading session, our pipeline ingests official price/volume data from NSE and BSE for stocks, indices, metals, and commodities.</li>
        <li><strong>Movement detection.</strong> We identify significant movers using thresholds: stocks &gt;1% with sufficient volume, indices &gt;0.5%, metals &gt;0.5%, commodities &gt;1%.</li>
        <li><strong>News retrieval.</strong> For each mover, we retrieve relevant news items from the last 48 hours via news APIs (Google News, GDELT) and major financial publications&apos; RSS feeds.</li>
        <li><strong>Drafting.</strong> Our editorial pipeline drafts the analysis using the real price data and retrieved news as the grounding context. Output is constrained to facts present in source data.</li>
        <li><strong>Quality gate.</strong> Pages with insufficient news coverage, fewer than 5 unique data points, or fewer than 250 words of analysis are not published.</li>
        <li><strong>Editorial review.</strong> A sample of published pages is reviewed daily by the Markets Desk for accuracy and tone.</li>
      </ol>

      <h2>Sources We Use</h2>
      <ul>
        <li><strong>Price data:</strong> National Stock Exchange (NSE), Bombay Stock Exchange (BSE), Yahoo Finance.</li>
        <li><strong>News:</strong> Reuters, PTI, Bloomberg, Moneycontrol, Economic Times, Business Standard, Mint, company filings on NSE/BSE.</li>
        <li><strong>Commodity prices:</strong> Public commodity exchanges and India Bullion Association.</li>
        <li><strong>Currency rates:</strong> ExchangeRate API, RBI reference rates.</li>
      </ul>
      <p>See our <Link href="/data-sources">Data Sources</Link> page for the full list.</p>

      <h2>Corrections</h2>
      <p>We correct factual errors promptly. See our <Link href="/corrections-policy">Corrections Policy</Link> for the process. To report an error, email <a href="mailto:corrections@niftypulse360.com">corrections@niftypulse360.com</a>.</p>

      <h2>What We Do Not Do</h2>
      <ul>
        <li>We do not provide buy, sell, or hold recommendations.</li>
        <li>We do not provide portfolio advice or asset allocation guidance.</li>
        <li>We do not predict future stock prices.</li>
        <li>We do not endorse brokers, advisors, or trading platforms.</li>
      </ul>

      <h2>Contact</h2>
      <p>Editorial questions: <a href="mailto:editor@niftypulse360.com">editor@niftypulse360.com</a><br/>
      Other inquiries: see <Link href="/contact">Contact</Link>.</p>
    </div>
  )
}
