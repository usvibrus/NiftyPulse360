// Component reviewed
interface StructuredDataProps {
  headline: string
  datePublished: string
  dateModified: string
  description: string
  url: string
  image?: string | string[]
  articleSection?: string
  keywords?: string[] | string
  about?: {
    type?: 'Corporation' | 'Thing'
    name: string
    tickerSymbol?: string
    exchange?: string
  }
}

export default function StructuredData({
  headline,
  datePublished,
  dateModified,
  description,
  url,
  image,
  articleSection = 'Stocks',
  keywords,
  about,
}: StructuredDataProps) {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

  const images = Array.isArray(image) ? image : image ? [image] : [`${SITE}/api/og?title=${encodeURIComponent(headline)}`]

  const aboutNode = about
    ? {
        '@type': about.type ?? 'Corporation',
        name: about.name,
        ...(about.tickerSymbol && { tickerSymbol: about.exchange ? `${about.exchange}:${about.tickerSymbol}` : about.tickerSymbol }),
      }
    : undefined

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: headline.slice(0, 110),
    description,
    image: images,
    datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      name: 'Market Data Desk',
      url: `${SITE}/authors/market-desk`,
      jobTitle: 'Markets Editorial Desk',
      worksFor: { '@type': 'Organization', name: 'NiftyPulse360', url: SITE },
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'NiftyPulse360',
      url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}/logo.svg`, width: 600, height: 60 },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    articleSection,
    inLanguage: 'en-IN',
    isAccessibleForFree: true,
    ...(keywords && { keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords }),
    ...(aboutNode && { about: aboutNode }),
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}
