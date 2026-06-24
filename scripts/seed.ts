import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SAMPLE_STOCKS = [
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', sector: 'Automobile' },
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Oil & Gas' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', sector: 'Banking' },
  { symbol: 'INFY', name: 'Infosys Limited', sector: 'IT' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', sector: 'Banking' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', sector: 'Telecom' },
  { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG' },
  { symbol: 'WIPRO', name: 'Wipro Limited', sector: 'IT' },
]

function generateContent(name: string, symbol: string, eventType: string, pct: number, date: string): string {
  const verb = eventType === 'RISE' ? 'rose' : 'fell'
  const sentiment = eventType === 'RISE' ? 'rally' : 'decline'
  return `<section><h2>${name} (${symbol}) — Price Summary</h2><p>${name} shares ${verb} sharply by ${pct.toFixed(2)}% on the NSE today, ${date}. The stock showed significant movement driven by market dynamics and sector-specific developments.</p></section><section><h2>Why Did ${name} Share Price ${eventType === 'RISE' ? 'Rise' : 'Fall'} Today?</h2><p>The ${pct.toFixed(1)}% ${sentiment} in ${name} shares today was driven by multiple factors including broader market sentiment, sector rotation, and company-specific news. Institutional investors showed ${eventType === 'RISE' ? 'strong buying interest' : 'selling pressure'} in the counter.</p><p>Market analysts note that the ${name} stock has been ${eventType === 'RISE' ? 'gaining momentum' : 'under pressure'} over the past few sessions. The company operates in the ${SAMPLE_STOCKS.find(s => s.symbol === symbol)?.sector || 'diversified'} sector which has seen ${eventType === 'RISE' ? 'positive' : 'negative'} sentiment recently.</p><ul><li>Broader market ${sentiment} driven by global cues</li><li>Sector-specific momentum and institutional activity</li><li>Technical levels triggered increased trading volume</li></ul><p>Investors should monitor upcoming quarterly results and management commentary for further direction. The stock's movement today reflects the ongoing dynamics in the Indian equity markets.</p></section><section><h2>Latest News</h2><p>Market participants are closely watching developments in the ${SAMPLE_STOCKS.find(s => s.symbol === symbol)?.sector || 'broader'} sector for further cues on price direction.</p></section>`
}

async function seed() {
  console.log('Seeding database...')

  for (let i = 0; i < 30; i++) {
    const stock = SAMPLE_STOCKS[i % SAMPLE_STOCKS.length]
    const daysAgo = i + 1
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    const dateStr = date.toISOString().split('T')[0]

    const eventType = Math.random() > 0.5 ? 'RISE' : 'FALL'
    const pct = 3 + Math.random() * 7
    const verb = eventType === 'RISE' ? 'rose' : 'fell'
    const slug = `why-${stock.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-share-price-${verb}-${Math.round(pct)}percent-today-${dateStr}`

    try {
      await prisma.stockEvent.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          symbol: stock.symbol,
          companyName: stock.name,
          exchange: 'NSE',
          sector: stock.sector,
          eventType,
          changePercent: pct,
          changeAmount: pct * 10,
          openPrice: 1000 + Math.random() * 2000,
          closePrice: 1000 + Math.random() * 2000,
          highPrice: 1100 + Math.random() * 2000,
          lowPrice: 900 + Math.random() * 2000,
          volume: BigInt(Math.floor(500000 + Math.random() * 5000000)),
          marketCap: Math.random() * 1000000000000,
          newsItems: [{ title: `${stock.name} shares ${verb} on market momentum`, url: '#', source: 'Market News', publishedAt: date.toISOString(), snippet: '' }],
          pageContent: generateContent(stock.name, stock.symbol, eventType, pct, dateStr),
          metaTitle: `Why ${stock.name} ${eventType === 'RISE' ? 'Rose' : 'Fell'} ${pct.toFixed(1)}% Today | ${dateStr}`,
          metaDesc: `${stock.name} (${stock.symbol}) share price ${verb} ${pct.toFixed(2)}% today on NSE. Find out the key reasons behind today's movement.`,
          keywords: [stock.symbol, stock.name, `${stock.symbol} share price`],
          eventDate: date,
        },
      })
      console.log(`  Created: ${slug}`)
    } catch (error) {
      console.error(`  Failed: ${slug}`, error)
    }
  }

  console.log('Seed complete!')
  await prisma.$disconnect()
}

seed()

// Script validated
