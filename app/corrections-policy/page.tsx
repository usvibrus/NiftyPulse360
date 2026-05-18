import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Corrections Policy',
  description: 'How NiftyPulse360 handles factual errors: how to report, how we correct, and how corrections are disclosed.',
  alternates: { canonical: '/corrections-policy' },
}

export default function CorrectionsPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 prose">
      <nav className="text-xs text-[#666] mb-3" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#1565C0]">Home</Link> › <span className="text-[#1A1A1A]">Corrections Policy</span>
      </nav>
      <h1>Corrections Policy</h1>
      <p className="text-sm text-[#666]">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <h2>Our Commitment</h2>
      <p>NiftyPulse360 strives for accuracy in every published page. When we make an error, we correct it promptly and transparently.</p>

      <h2>How to Report an Error</h2>
      <p>Email <a href="mailto:corrections@niftypulse360.com">corrections@niftypulse360.com</a> with:</p>
      <ul>
        <li>The URL of the page in question.</li>
        <li>The specific claim you believe is incorrect, copy-pasted from the page.</li>
        <li>The source for the correct information (link to NSE/BSE filing, news article, etc.).</li>
        <li>Your name and contact (optional, but helpful if we need to follow up).</li>
      </ul>

      <h2>What We Correct</h2>
      <p>We correct:</p>
      <ul>
        <li>Incorrect prices, percentages, volumes, or other numeric data.</li>
        <li>Misattributed news (a story attributed to the wrong publisher).</li>
        <li>Misnamed companies, executives, or products.</li>
        <li>Misstated dates of events (earnings, ex-dividend, board meetings).</li>
        <li>Misclassified sectors or index memberships.</li>
      </ul>

      <h2>How We Correct</h2>
      <ol>
        <li>We update the page with the correct information.</li>
        <li>We add a visible &quot;Correction&quot; note at the top or bottom of the page indicating what was corrected and the date.</li>
        <li>We update the <code>dateModified</code> field in the page schema so search engines can re-crawl the corrected version.</li>
        <li>For material errors (e.g., wrong direction of price move), we additionally re-submit the page to the indexing API.</li>
      </ol>

      <h2>Correction Examples</h2>
      <p>An example correction note looks like:</p>
      <blockquote>
        <strong>Correction (18 May 2026):</strong> An earlier version of this article stated that XYZ rose 5.2% today. The correct figure is 2.5%. The page has been updated.
      </blockquote>

      <h2>Response Time</h2>
      <ul>
        <li>Acknowledgement within 24 hours of receiving the report.</li>
        <li>Correction published within 48 hours of confirmation.</li>
        <li>Material errors involving misleading direction or magnitude are corrected within 6 hours of confirmation.</li>
      </ul>

      <h2>Persistent Archive</h2>
      <p>We do not delete pages after correction. The original publication date is preserved, the correction note is added, and the page remains accessible. We do not silently rewrite history.</p>

      <h2>Limitations</h2>
      <ul>
        <li>We cannot correct opinions of cited analysts. If a source is misquoted, we will correct that.</li>
        <li>We cannot retroactively change auto-generated copy on archived pages older than 90 days unless the correction is materially significant.</li>
      </ul>

      <h2>Contact</h2>
      <p>Corrections: <a href="mailto:corrections@niftypulse360.com">corrections@niftypulse360.com</a><br/>
      General editorial: <a href="mailto:editor@niftypulse360.com">editor@niftypulse360.com</a></p>
    </div>
  )
}
