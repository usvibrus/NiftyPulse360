import Parser from 'rss-parser'

export interface NewsItem {
  title: string
  url: string
  source: string
  publishedAt: string
  publishedDate: Date
  snippet: string
}

const parser = new Parser({ timeout: 8000 })

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const HOURS_48_MS = 48 * 60 * 60 * 1000

const TRUSTED_FEEDS = [
  { source: 'Economic Times', url: 'https://economictimes.indiatimes.com/markets/stocks/rss.cms' },
  { source: 'Moneycontrol', url: 'https://www.moneycontrol.com/rss/marketreports.xml' },
  { source: 'Business Standard', url: 'https://www.business-standard.com/rss/markets-106.rss' },
  { source: 'Mint', url: 'https://www.livemint.com/rss/markets' },
  { source: 'Zerodha Pulse', url: 'https://pulse.zerodha.com/atom.xml' },
]

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins} min ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

async function fetchGoogleNews(query: string): Promise<NewsItem[]> {
  try {
    const encoded = encodeURIComponent(query)
    const url = `https://news.google.com/rss/search?q=${encoded}&hl=en-IN&gl=IN&ceid=IN:en`
    const feed = await parser.parseURL(url)

    const cutoff = Date.now() - HOURS_48_MS

    return (feed.items || [])
      .map(item => {
        // Undated items get an invalid date and are filtered out below instead of
        // being presented as "just published"
        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date(NaN)
        return {
          title: item.title || '',
          url: item.link || '',
          source: item.creator || (item as { source?: { name?: string } }).source?.name || 'Google News',
          publishedAt: timeAgo(pubDate),
          publishedDate: pubDate,
          snippet: item.contentSnippet || item.content || '',
        }
      })
      .filter(item => item.publishedDate.getTime() >= cutoff)
      .slice(0, 10)
  } catch (error) {
    console.error('[newsService] Google News RSS failed:', error)
    return []
  }
}

async function fetchTrustedFeeds(stockName: string): Promise<NewsItem[]> {
  const results: NewsItem[] = []
  const cutoff = Date.now() - HOURS_48_MS
  const stockLower = stockName.toLowerCase()
  const firstWord = stockName.split(' ')[0].toLowerCase()
  // Whole-word match so short names don't hit substrings (e.g. "itc" inside "switch")
  const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const terms = [stockLower, firstWord].filter(t => t.trim().length > 0).map(escapeRe)
  if (terms.length === 0) return results
  const nameRe = new RegExp(`\\b(?:${terms.join('|')})\\b`)

  for (const feed of TRUSTED_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url)
      for (const item of parsed.items || []) {
        const titleLower = (item.title || '').toLowerCase()
        if (!nameRe.test(titleLower)) continue

        // Skip undated or unparseable items instead of treating them as "now"
        if (!item.pubDate) continue
        const pubDate = new Date(item.pubDate)
        if (Number.isNaN(pubDate.getTime()) || pubDate.getTime() < cutoff) continue

        results.push({
          title: item.title || '',
          url: item.link || '',
          source: feed.source,
          publishedAt: timeAgo(pubDate),
          publishedDate: pubDate,
          snippet: item.contentSnippet || '',
        })
      }
    } catch {
      // skip this feed on failure
    }
  }

  return results
}

async function fetchMarketaux(symbol: string): Promise<NewsItem[]> {
  if (!process.env.MARKETAUX_API_KEY) return []
  const cutoff = Date.now() - HOURS_48_MS

  try {
    const params = new URLSearchParams({
      symbols: symbol,
      filter_entities: 'true',
      language: 'en',
      api_token: process.env.MARKETAUX_API_KEY!,
      limit: '5',
    })
    const res = await fetch(`https://api.marketaux.com/v1/news/all?${params}`, {
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    const json = await res.json()

    return (json.data || [])
      .map((item: { title: string; url: string; source: string; published_at: string; description: string }) => {
        const pubDate = new Date(item.published_at)
        return {
          title: item.title,
          url: item.url,
          source: item.source,
          publishedAt: timeAgo(pubDate),
          publishedDate: pubDate,
          snippet: item.description || '',
        }
      })
      .filter((item: NewsItem) => item.publishedDate.getTime() >= cutoff)
  } catch (error) {
    console.error('[newsService] Marketaux failed:', error)
    return []
  }
}

export async function getNewsForStock(symbol: string, companyName: string): Promise<NewsItem[]> {
  // GUIDE: Strictly filter to last 48 hours
  const sources = await Promise.all([
    fetchGoogleNews(`${companyName} stock NSE`),
    fetchTrustedFeeds(companyName),
  ])

  let allNews = [...sources[0], ...sources[1]]
  await delay(300)

  if (allNews.length < 3) {
    const extra = await fetchMarketaux(symbol)
    allNews = [...allNews, ...extra]
  }

  // Deduplicate by title (case-insensitive)
  const seen = new Set<string>()
  const deduped = allNews.filter(item => {
    const key = item.title.toLowerCase().substring(0, 50)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Sort by date - most recent first
  deduped.sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime())

  return deduped.slice(0, 5)
}

export async function getNewsForTopic(topic: string): Promise<NewsItem[]> {
  const news = await fetchGoogleNews(`${topic} India today`)
  await delay(300)
  return news.slice(0, 5)
}
