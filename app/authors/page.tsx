import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Authors',
  description: 'Editorial bylines at NiftyPulse360.',
  alternates: { canonical: '/authors' },
}

export default function AuthorsIndex() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 prose">
      <nav className="text-xs text-[#666] mb-3" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#1565C0]">Home</Link> › <span className="text-[#1A1A1A]">Authors</span>
      </nav>
      <h1>Authors</h1>
      <p>NiftyPulse360 publishes under the following editorial bylines:</p>
      <ul>
        <li><Link href="/authors/market-desk"><strong>Market Data Desk</strong></Link> — daily explanations of stock, index, commodity, and currency movements.</li>
      </ul>
      <p>For details on how stories are produced see our <Link href="/methodology">Methodology</Link> and <Link href="/editorial-guidelines">Editorial Guidelines</Link>.</p>
    </div>
  )
}
