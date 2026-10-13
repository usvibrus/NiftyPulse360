import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'
const PUB_NAME = 'NiftyPulse360'

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export async function GET() {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000)

  const [stocks, indices, metals, commodities, currencies] = await Promise.all([
    prisma.stockEvent.findMany({
      where: { isPublished: true, publishedAt: { gte: cutoff } },
      select: { slug: true, metaTitle: true, publishedAt: true, symbol: true, companyName: true, sector: true, keywords: true },
      orderBy: { publishedAt: 'desc' },
      take: 1000,
    }),
    prisma.indexEvent.findMany({
      where: { isPublished: true, publishedAt: { gte: cutoff } },
      select: { slug: true, metaTitle: true, publishedAt: true, indexName: true, keywords: true },
      orderBy: { publishedAt: 'desc' },
      take: 200,
    }),
    prisma.metalEvent.findMany({
      where: { isPublished: true, publishedAt: { gte: cutoff } },
      select: { slug: true, metaTitle: true, publishedAt: true, metal: true, keywords: true },
      orderBy: { publishedAt: 'desc' },
      take: 200,
    }),
    prisma.commodityEvent.findMany({
      where: { isPublished: true, publishedAt: { gte: cutoff } },
      select: { slug: true, metaTitle: true, publishedAt: true, commodity: true, keywords: true },
      orderBy: { publishedAt: 'desc' },
      take: 200,
    }),
    prisma.currencyEvent.findMany({
      where: { isPublished: true, publishedAt: { gte: cutoff } },
      select: { slug: true, metaTitle: true, publishedAt: true, pair: true, keywords: true },
      orderBy: { publishedAt: 'desc' },
      take: 200,
    }),
  ])

  type Item = { url: string; title: string; date: Date; keywords: string[] }
  const items: Item[] = [
    ...stocks.map(s => ({
      url: `${SITE}/stocks/${s.slug}`,
      title: s.metaTitle,
      date: s.publishedAt,
      keywords: [...(s.keywords || []), s.symbol, s.companyName, s.sector || 'Stocks'].filter(Boolean),
    })),
    ...indices.map(i => ({
      url: `${SITE}/indices/${i.slug}`,
      title: i.metaTitle,
      date: i.publishedAt,
      keywords: [...(i.keywords || []), i.indexName, 'Indices'],
    })),
    ...metals.map(m => ({
      url: `${SITE}/gold/${m.slug}`,
      title: m.metaTitle,
      date: m.publishedAt,
      keywords: [...(m.keywords || []), m.metal, 'Gold', 'Silver', 'Precious Metals'],
    })),
    ...commodities.map(c => ({
      url: `${SITE}/commodities/${c.slug}`,
      title: c.metaTitle,
      date: c.publishedAt,
      keywords: [...(c.keywords || []), c.commodity, 'Commodities'],
    })),
    ...currencies.map(c => ({
      url: `${SITE}/commodities/${c.slug}`,
      title: c.metaTitle,
      date: c.publishedAt,
      keywords: [...(c.keywords || []), c.pair, 'Currency', 'Forex'],
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 1000)

  const urlEntries = items.map(it => `  <url>
    <loc>${escapeXml(it.url)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(PUB_NAME)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${it.date.toISOString()}</news:publication_date>
      <news:title>${escapeXml(it.title)}</news:title>
      <news:keywords>${escapeXml(it.keywords.slice(0, 10).join(', '))}</news:keywords>
    </news:news>
  </url>`).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlEntries}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
