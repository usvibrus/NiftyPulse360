import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'Disclaimer for NiftyPulse360 — important information about our content and financial advice.',
}

export default function DisclaimerPage() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'NiftyPulse360'

  return (
    <div className="max-w-3xl mx-auto prose">
      <h1>Disclaimer</h1>

      <h2>Not Financial Advice</h2>
      <p>The information provided on {siteName} is for <strong>informational and educational purposes only</strong>. It should not be construed as financial advice, investment advice, trading advice, or any other type of advice.</p>

      <h2>No SEBI Registration</h2>
      <p>We are <strong>not registered with SEBI (Securities and Exchange Board of India)</strong> as investment advisors, research analysts, or portfolio managers. We do not provide personalized investment recommendations.</p>

      <h2>Do Not Make Investment Decisions Based on This Content</h2>
      <p>You should <strong>not make any investment decisions</strong> based solely on the information provided on this website. Always consult with a qualified financial advisor before making any investment decisions. Past performance of stocks, indices, or commodities does not guarantee future results.</p>

      <h2>Accuracy of Information</h2>
      <p>While we strive to provide accurate and up-to-date information, we make no representations or warranties of any kind about the completeness, accuracy, reliability, or suitability of the information. Market data is sourced from third-party providers and may be delayed or inaccurate.</p>

      <h2>Risk Disclosure</h2>
      <p>Investing in the stock market involves substantial risk of loss. The value of investments can go down as well as up. You may lose some or all of your invested capital. Only invest money that you can afford to lose.</p>

      <h2>Third-Party Content</h2>
      <p>News articles and external links on this website are sourced from third-party publishers. We do not endorse or verify the accuracy of third-party content.</p>

      <h2>Limitation of Liability</h2>
      <p>{siteName} and its operators shall not be liable for any losses, damages, or claims arising from the use of information on this website.</p>
    </div>
  )
}
