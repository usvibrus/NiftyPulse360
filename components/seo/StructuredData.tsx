interface StructuredDataProps {
  headline: string
  datePublished: string
  dateModified: string
  description: string
  url: string
}

export default function StructuredData({ headline, datePublished, dateModified, description, url }: StructuredDataProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline,
    datePublished,
    dateModified,
    description,
    url,
    author: { '@type': 'Organization', name: process.env.NEXT_PUBLIC_SITE_NAME || 'NiftyPulse360' },
    publisher: { '@type': 'Organization', name: process.env.NEXT_PUBLIC_SITE_NAME || 'NiftyPulse360' },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}
