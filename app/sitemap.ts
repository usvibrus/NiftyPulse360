import { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

// Main sitemap = sitemap index. Per-type sitemaps live as XML route handlers.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'
  const now = new Date()

  // Static high-priority pages
  return [
    { url: baseUrl, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${baseUrl}/stocks`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/stocks/top-gainers-today`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/stocks/top-losers-today`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    // Sector listing pages — high-intent daily-search keywords
    { url: `${baseUrl}/stocks/nifty-it-stocks-today`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/stocks/nifty-pharma-stocks-today`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/stocks/nifty-auto-stocks-today`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/stocks/nifty-realty-stocks-today`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/stocks/nifty-ev-stocks-today`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    // Circuit & 52-week pages
    { url: `${baseUrl}/stocks/upper-circuit-stocks-today`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/stocks/lower-circuit-stocks-today`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/stocks/52-week-high-stocks-today`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/stocks/52-week-low-stocks-today`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/indices`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/gold`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/commodities`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/privacy-policy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/disclaimer`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/editorial-guidelines`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/methodology`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/corrections-policy`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/data-sources`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/authors/market-desk`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]
}
