import { MetadataRoute } from 'next'

// Bots that crawl heavily but send no traffic. Block to reduce compute load.
// Includes AI scrapers, mobile/desktop assistant bots, and SEO crawlers.
const BLOCKED_BOTS = [
  // AI/LLM training scrapers
  'GPTBot',                  // OpenAI
  'ChatGPT-User',            // OpenAI
  'OAI-SearchBot',           // OpenAI search
  'CCBot',                   // Common Crawl (used by many AI training sets)
  'anthropic-ai',            // Anthropic
  'Claude-Web',              // Anthropic
  'ClaudeBot',               // Anthropic
  'cohere-ai',               // Cohere
  'PerplexityBot',           // Perplexity
  'Google-Extended',         // Google AI training (separate from search)
  'FacebookBot',             // Meta AI training
  'meta-externalagent',      // Meta AI
  'Bytespider',              // ByteDance / TikTok AI
  'Diffbot',                 // Diffbot AI scraping
  'omgili',                  // Webz.io scraping
  'omgilibot',
  'ImagesiftBot',            // Hive AI image scraping
  'YouBot',                  // You.com
  'Amazonbot',               // Amazon Alexa AI
  'Applebot',                // Apple intelligence/Siri
  'Applebot-Extended',       // Apple AI training
  'AwarioRssBot',            // Awario social listening
  'AwarioSmartBot',
  'PetalBot',                // Huawei
  'DataForSeoBot',           // DataForSEO crawler
  'AhrefsBot',               // Ahrefs SEO
  'SemrushBot',              // Semrush SEO
  'MJ12bot',                 // Majestic SEO
  'DotBot',                  // Moz / OpenSiteExplorer
  'BLEXBot',                 // WebMeUp SEO
  'serpstatbot',             // Serpstat SEO
  'ZoominfoBot',             // ZoomInfo
  'Pinterestbot',            // Already crawling fine - keep allowed if you use Pinterest
  // Add more as needed
]

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

  const blockedRules = BLOCKED_BOTS.filter(b => b !== 'Pinterestbot').map(userAgent => ({
    userAgent,
    disallow: '/',
  }))

  return {
    rules: [
      // Default rule for all unknown bots. /_next/ stays crawlable: search engines need
      // the CSS/JS chunks to render pages, and blocking them is flagged as a render issue.
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/*?*utm_'] },
      // Allow major search engines explicitly
      { userAgent: 'Googlebot', allow: '/', disallow: ['/api/', '/admin/'] },
      { userAgent: 'Googlebot-News', allow: '/', disallow: ['/api/', '/admin/'] },
      { userAgent: 'Googlebot-Image', allow: '/', disallow: ['/api/', '/admin/'] },
      { userAgent: 'Bingbot', allow: '/', disallow: ['/api/', '/admin/'] },
      { userAgent: 'Yandex', allow: '/', disallow: ['/api/', '/admin/'] },
      { userAgent: 'DuckDuckBot', allow: '/', disallow: ['/api/', '/admin/'] },
      { userAgent: 'Slurp', allow: '/', disallow: ['/api/', '/admin/'] }, // Yahoo
      // Bots that ignore robots.txt are hard-blocked in proxy.ts
      ...blockedRules,
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
