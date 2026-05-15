import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const [stocks, indices, metals, commodities, currencies] = await Promise.all([
    prisma.stockEvent.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true }, orderBy: { publishedAt: 'desc' }, take: 5000 }),
    prisma.indexEvent.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true }, orderBy: { publishedAt: 'desc' }, take: 5000 }),
    prisma.metalEvent.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true }, orderBy: { publishedAt: 'desc' }, take: 5000 }),
    prisma.commodityEvent.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true }, orderBy: { publishedAt: 'desc' }, take: 5000 }),
    prisma.currencyEvent.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true }, orderBy: { publishedAt: 'desc' }, take: 5000 }),
  ])

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'hourly' as const, priority: 1 },
    { url: `${baseUrl}/stocks`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/indices`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/gold`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/commodities`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${baseUrl}/disclaimer`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
  ]

  const dynamicPages = [
    ...stocks.map(e => ({ url: `${baseUrl}/stocks/${e.slug}`, lastModified: e.updatedAt, changeFrequency: 'daily' as const, priority: 0.8 })),
    ...indices.map(e => ({ url: `${baseUrl}/indices/${e.slug}`, lastModified: e.updatedAt, changeFrequency: 'daily' as const, priority: 0.8 })),
    ...metals.map(e => ({ url: `${baseUrl}/gold/${e.slug}`, lastModified: e.updatedAt, changeFrequency: 'daily' as const, priority: 0.8 })),
    ...commodities.map(e => ({ url: `${baseUrl}/commodities/${e.slug}`, lastModified: e.updatedAt, changeFrequency: 'daily' as const, priority: 0.7 })),
    ...currencies.map(e => ({ url: `${baseUrl}/commodities/${e.slug}`, lastModified: e.updatedAt, changeFrequency: 'daily' as const, priority: 0.7 })),
  ]

  return [...staticPages, ...dynamicPages]
}
