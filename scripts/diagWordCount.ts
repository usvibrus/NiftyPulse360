import { prisma } from '../lib/db/prisma'

function stripHtml(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  const recent = await prisma.stockEvent.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    select: { symbol: true, pageContent: true, changePercent: true, newsItems: true },
  })

  console.log('Word count distribution of last 20 published stock pages:\n')
  const counts: number[] = []
  for (const r of recent) {
    const wc = stripHtml(r.pageContent).split(/\s+/).filter(Boolean).length
    counts.push(wc)
    const newsCount = Array.isArray(r.newsItems) ? r.newsItems.length : 0
    console.log(`  ${r.symbol.padEnd(15)} | ${wc.toString().padStart(4)} words | ${r.changePercent.toFixed(2)}% | news=${newsCount}`)
  }

  if (counts.length) {
    const min = Math.min(...counts)
    const max = Math.max(...counts)
    const avg = Math.round(counts.reduce((a, b) => a + b, 0) / counts.length)
    console.log(`\n  min=${min}  max=${max}  avg=${avg}`)
    console.log(`  Pages that would PASS gate (>=800): ${counts.filter(c => c >= 800).length}/${counts.length}`)
    console.log(`  Pages that would PASS gate (>=400): ${counts.filter(c => c >= 400).length}/${counts.length}`)
    console.log(`  Pages that would PASS gate (>=300): ${counts.filter(c => c >= 300).length}/${counts.length}`)
  }
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
