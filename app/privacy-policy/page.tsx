// accessibility: verified
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for NiftyPulse360 — how we collect, use, and protect your data.',
}

export default function PrivacyPolicyPage() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'NiftyPulse360'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

  return (
    <div className="max-w-3xl mx-auto prose">
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <p>At {siteName} ({siteUrl}), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website.</p>

      <h2>Information We Collect</h2>
      <p>We may collect the following types of information:</p>
      <ul>
        <li><strong>Log Data:</strong> Your browser type, IP address, pages visited, time spent on pages, and other diagnostic data.</li>
        <li><strong>Cookies:</strong> We use cookies to improve your browsing experience and for analytics purposes.</li>
      </ul>

      <h2>Third-Party Advertising</h2>
      <p>We use Google AdSense to display advertisements on our website. Google AdSense may use cookies and web beacons to serve ads based on your prior visits to our website or other websites. You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</p>

      <h2>Third-Party Links</h2>
      <p>Our website contains links to external news sources and financial websites. We are not responsible for the privacy practices of these external sites.</p>

      <h2>Data Security</h2>
      <p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>

      <h2>Children&apos;s Privacy</h2>
      <p>Our website is not intended for children under 13. We do not knowingly collect personal information from children.</p>

      <h2>Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date.</p>

      <h2>Contact Us</h2>
      <p>If you have questions about this Privacy Policy, please visit our <a href="/contact">contact page</a>.</p>
    </div>
  )
}
