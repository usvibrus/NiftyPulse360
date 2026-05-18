import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/_next/', '/*?*utm_'] },
      { userAgent: 'Googlebot', allow: '/', disallow: ['/api/', '/admin/'] },
      { userAgent: 'Googlebot-News', allow: '/', disallow: ['/api/', '/admin/'] },
      { userAgent: 'Bingbot', allow: '/', disallow: ['/api/', '/admin/'] },
      { userAgent: 'Yandex', allow: '/', disallow: ['/api/', '/admin/'] },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/news-sitemap.xml`,
      `${baseUrl}/stocks-sitemap.xml`,
      `${baseUrl}/indices-sitemap.xml`,
      `${baseUrl}/gold-sitemap.xml`,
      `${baseUrl}/commodities-sitemap.xml`,
    ],
    host: baseUrl,
  }
}
