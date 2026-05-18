import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 60

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'
const PUB_NAME = 'NiftyPulse360'
const PUB_DESC = 'Real-time Indian stock market news, analysis and explanations of why stocks moved.'
const HUB = 'https://pubsubhubbub.appspot.com/'

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

export async function GET() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [stocks, indices, metals, commodities] = await Promise.all([
    prisma.stockEvent.findMany({
      where: { isPublished: true, publishedAt: { gte: cutoff } },
      select: { slug: true, metaTitle: true, metaDesc: true, publishedAt: true, symbol: true, sector: true, keywords: true },
      orderBy: { publishedAt: 'desc' },
      take: 100,
    }),
    prisma.indexEvent.findMany({
      where: { isPublished: true, publishedAt: { gte: cutoff } },
      select: { slug: true, metaTitle: true, metaDesc: true, publishedAt: true, indexName: true, keywords: true },
      orderBy: { publishedAt: 'desc' },
      take: 30,
    }),
    prisma.metalEvent.findMany({
      where: { isPublished: true, publishedAt: { gte: cutoff } },
      select: { slug: true, metaTitle: true, metaDesc: true, publishedAt: true, metal: true, keywords: true },
      orderBy: { publishedAt: 'desc' },
      take: 30,
    }),
    prisma.commodityEvent.findMany({
      where: { isPublished: true, publishedAt: { gte: cutoff } },
      select: { slug: true, metaTitle: true, metaDesc: true, publishedAt: true, commodity: true, keywords: true },
      orderBy: { publishedAt: 'desc' },
      take: 30,
    }),
  ])

  type Item = { url: string; title: string; desc: string; date: Date; category: string; keywords: string[] }
  const items: Item[] = [
    ...stocks.map(s => ({ url: `${SITE}/stocks/${s.slug}`, title: s.metaTitle, desc: s.metaDesc, date: s.publishedAt, category: 'Stocks', keywords: [...(s.keywords || []), s.symbol, s.sector || 'Stocks'].filter(Boolean) })),
    ...indices.map(i => ({ url: `${SITE}/indices/${i.slug}`, title: i.metaTitle, desc: i.metaDesc, date: i.publishedAt, category: 'Indices', keywords: [...(i.keywords || []), i.indexName] })),
    ...metals.map(m => ({ url: `${SITE}/gold/${m.slug}`, title: m.metaTitle, desc: m.metaDesc, date: m.publishedAt, category: 'Gold', keywords: [...(m.keywords || []), m.metal] })),
    ...commodities.map(c => ({ url: `${SITE}/commodities/${c.slug}`, title: c.metaTitle, desc: c.metaDesc, date: c.publishedAt, category: 'Commodities', keywords: [...(c.keywords || []), c.commodity] })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 100)

  const lastBuild = items[0]?.date.toUTCString() ?? new Date().toUTCString()

  const itemsXml = items.map(it => `    <item>
      <title>${escapeXml(it.title)}</title>
      <link>${escapeXml(it.url)}</link>
      <guid isPermaLink="true">${escapeXml(it.url)}</guid>
      <pubDate>${it.date.toUTCString()}</pubDate>
      <description>${cdata(it.desc)}</description>
      <category>${escapeXml(it.category)}</category>
${it.keywords.slice(0, 6).map(k => `      <category>${escapeXml(k)}</category>`).join('\n')}
      <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">Market Data Desk</dc:creator>
    </item>`).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(PUB_NAME)}</title>
    <link>${escapeXml(SITE)}</link>
    <description>${escapeXml(PUB_DESC)}</description>
    <language>en-in</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <copyright>© ${new Date().getFullYear()} ${escapeXml(PUB_NAME)}</copyright>
    <ttl>5</ttl>
    <atom:link rel="self" type="application/rss+xml" href="${escapeXml(`${SITE}/feed.xml`)}"/>
    <atom:link rel="hub" href="${escapeXml(HUB)}"/>
    <image>
      <url>${escapeXml(`${SITE}/logo.svg`)}</url>
      <title>${escapeXml(PUB_NAME)}</title>
      <link>${escapeXml(SITE)}</link>
    </image>
${itemsXml}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
