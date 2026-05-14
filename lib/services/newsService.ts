import Parser from 'rss-parser'
import axios from 'axios'

export interface NewsItem {
  title: string
  url: string
  source: string
  publishedAt: string
  snippet: string
}

const parser = new Parser()

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchGoogleNews(query: string): Promise<NewsItem[]> {
  try {
    const encoded = encodeURIComponent(query)
    const url = `https://news.google.com/rss/search?q=${encoded}&hl=en-IN&gl=IN&ceid=IN:en`
    const feed = await parser.parseURL(url)

    return (feed.items || []).slice(0, 5).map(item => ({
      title: item.title || '',
      url: item.link || '',
      source: item.creator || item.source?.name || 'Google News',
      publishedAt: item.pubDate || new Date().toISOString(),
      snippet: item.contentSnippet || item.content || '',
    }))
  } catch (error) {
    console.error('[newsService] Google News RSS failed:', error)
    return []
  }
}

async function fetchMarketaux(symbol: string): Promise<NewsItem[]> {
  if (!process.env.MARKETAUX_API_KEY) return []

  try {
    const res = await axios.get('https://api.marketaux.com/v1/news/all', {
      params: {
        symbols: symbol,
        filter_entities: true,
        language: 'en',
        api_token: process.env.MARKETAUX_API_KEY,
        limit: 5,
      },
    })

    return (res.data.data || []).map((item: { title: string; url: string; source: string; published_at: string; description: string }) => ({
      title: item.title,
      url: item.url,
      source: item.source,
      publishedAt: item.published_at,
      snippet: item.description || '',
    }))
  } catch (error) {
    console.error('[newsService] Marketaux failed:', error)
    return []
  }
}

export async function getNewsForStock(symbol: string, companyName: string): Promise<NewsItem[]> {
  const query = `${companyName} stock NSE today`
  let news = await fetchGoogleNews(query)
  await delay(500)

  if (news.length < 3) {
    const extra = await fetchMarketaux(symbol)
    news = [...news, ...extra]
  }

  // Deduplicate by title
  const seen = new Set<string>()
  return news.filter(item => {
    if (seen.has(item.title)) return false
    seen.add(item.title)
    return true
  }).slice(0, 5)
}

export async function getNewsForTopic(topic: string): Promise<NewsItem[]> {
  const news = await fetchGoogleNews(`${topic} India today`)
  await delay(500)
  return news.slice(0, 5)
}
