import { prisma } from '../lib/db/prisma'

async function main() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  console.log('Checking records since:', today.toISOString())

  const [stocks, indices, metals, commodities, queue] = await Promise.all([
    prisma.stockEvent.findMany({
      where: { publishedAt: { gte: today } },
      select: { slug: true, symbol: true, eventType: true, changePercent: true, publishedAt: true, isPublished: true, eventDate: true },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.indexEvent.findMany({
      where: { publishedAt: { gte: today } },
      select: { slug: true, indexName: true, eventType: true, changePercent: true, publishedAt: true, isPublished: true },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.metalEvent.findMany({
      where: { publishedAt: { gte: today } },
      select: { slug: true, metal: true, eventType: true, changePercent: true, pricePerOunce: true, publishedAt: true, isPublished: true },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.commodityEvent.findMany({
      where: { publishedAt: { gte: today } },
      select: { slug: true, commodity: true, eventType: true, changePercent: true, publishedAt: true, isPublished: true },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.indexingQueue.findMany({
      where: { createdAt: { gte: today } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  console.log('\n=== STOCKS today:', stocks.length, '===')
  stocks.forEach(s => console.log(`  ${s.publishedAt.toISOString()} | ${s.symbol} | ${s.eventType} ${s.changePercent.toFixed(2)}% | published=${s.isPublished} | ${s.slug.slice(0, 60)}`))

  console.log('\n=== INDICES today:', indices.length, '===')
  indices.forEach(i => console.log(`  ${i.publishedAt.toISOString()} | ${i.indexName} | ${i.eventType} ${i.changePercent.toFixed(2)}% | published=${i.isPublished}`))

  console.log('\n=== METALS today:', metals.length, '===')
  metals.forEach(m => console.log(`  ${m.publishedAt.toISOString()} | ${m.metal} | ${m.eventType} ${m.changePercent.toFixed(2)}% | ₹${m.pricePerOunce.toFixed(2)}/oz | published=${m.isPublished}`))

  console.log('\n=== COMMODITIES today:', commodities.length, '===')
  commodities.forEach(c => console.log(`  ${c.publishedAt.toISOString()} | ${c.commodity} | ${c.eventType} ${c.changePercent.toFixed(2)}% | published=${c.isPublished}`))

  console.log('\n=== INDEXING QUEUE today:', queue.length, '===')
  queue.forEach(q => console.log(`  ${q.createdAt.toISOString()} | ${q.url.slice(0, 80)} | success=${q.success} | attempts=${q.attempts}`))

  // Total count check
  const totals = await Promise.all([
    prisma.stockEvent.count({ where: { isPublished: true } }),
    prisma.indexEvent.count({ where: { isPublished: true } }),
    prisma.metalEvent.count({ where: { isPublished: true } }),
    prisma.commodityEvent.count({ where: { isPublished: true } }),
  ])
  console.log('\n=== TOTAL PUBLISHED COUNTS ===')
  console.log(`  Stocks: ${totals[0]}, Indices: ${totals[1]}, Metals: ${totals[2]}, Commodities: ${totals[3]}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

// Script validated
