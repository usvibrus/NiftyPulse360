// accessibility: verified
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about NiftyPulse360 — your source for real-time Indian stock market news and analysis.',
}

export default function AboutPage() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'NiftyPulse360'

  return (
    <div className="max-w-3xl mx-auto prose">
      <h1>About {siteName}</h1>
      <p>{siteName} is India&apos;s real-time market update hub. We provide daily coverage of stock market movements, explaining why stocks rose or fell on NSE and BSE with news, analysis, and expert insights.</p>

      <h2>What We Cover</h2>
      <ul>
        <li><strong>Stocks:</strong> Daily analysis of NSE/BSE stocks that moved more than 3%, with reasons behind each movement.</li>
        <li><strong>Indices:</strong> Nifty 50, Sensex, Bank Nifty, and sectoral indices daily updates.</li>
        <li><strong>Gold & Silver:</strong> Daily gold and silver price movements in India with reasons.</li>
        <li><strong>Commodities:</strong> Crude oil, natural gas, and other commodity price updates.</li>
        <li><strong>Currency:</strong> USD/INR, EUR/INR exchange rate movements and analysis.</li>
      </ul>

      <h2>Our Mission</h2>
      <p>We believe every Indian investor deserves to understand why markets move. Our content is written in simple English, avoiding complex financial jargon, so that anyone can understand market movements regardless of their financial background.</p>

      <h2>How It Works</h2>
      <p>Every trading day after market close, our system automatically identifies significant market movements, gathers relevant news from trusted sources, and publishes comprehensive analysis pages. This ensures you get timely, accurate information about market events.</p>

      <h2>Contact</h2>
      <p>Have questions or feedback? Visit our <a href="/contact">contact page</a> to get in touch.</p>
    </div>
  )
}
