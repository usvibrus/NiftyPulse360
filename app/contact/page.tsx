import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with NiftyPulse360 for questions, feedback, or business inquiries.',
}

export default function ContactPage() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'NiftyPulse360'

  return (
    <div className="max-w-3xl mx-auto prose">
      <h1>Contact Us</h1>
      <p>We&apos;d love to hear from you. Whether you have a question, feedback, or a business inquiry, feel free to reach out.</p>

      <h2>Email</h2>
      <p>For general inquiries: <strong>contact@niftypulse360.com</strong></p>
      <p>For business/advertising: <strong>business@niftypulse360.com</strong></p>

      <h2>Response Time</h2>
      <p>We typically respond within 24-48 hours on business days.</p>

      <h2>Feedback</h2>
      <p>Your feedback helps us improve {siteName}. If you notice any inaccuracies in our content or have suggestions for improvement, please let us know.</p>

      <h2>Report an Issue</h2>
      <p>If you find any technical issues, broken links, or incorrect data on our website, please email us with the page URL and a description of the issue.</p>
    </div>
  )
}
