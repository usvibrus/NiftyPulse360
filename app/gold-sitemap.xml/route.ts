import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://niftypulse360.com'

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export async function GET() {
  const metals = await prisma.metalEvent.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
    take: 50000,
  })

  const urls = metals.map(m => `  <url>
    <loc>${escapeXml(`${SITE}/gold/${m.slug}`)}</loc>
    <lastmod>${m.updatedAt.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(`${SITE}/gold`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
${urls}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
    },
  })
}

// Sitemap format verified
