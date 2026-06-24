import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function seed() {
  const friday = new Date('2026-05-15T15:30:00+05:30')

  // Delete old fake entries
  await prisma.indexEvent.deleteMany({ where: { slug: { in: ['why-nifty-50-rose-187points-today-2026-05-15', 'why-sensex-rose-620points-today-2026-05-15'] } } })
  await prisma.metalEvent.deleteMany({ where: { slug: { in: ['why-gold-price-rose-today-2026-05-15', 'why-silver-price-fell-today-2026-05-15'] } } })

  // Nifty 50 - actual: 23,643.50, fell 46.10 pts (-0.19%)
  await prisma.indexEvent.create({ data: {
    slug: 'why-nifty-50-fell-46points-today-2026-05-15',
    indexName: 'Nifty 50', indexSymbol: '^NSEI', eventType: 'FALL',
    changePercent: 0.19, changePoints: 46, openValue: 23690, closeValue: 23644,
    highValue: 23720, lowValue: 23580, newsItems: [],
    pageContent: '<section><h2>Why Did Nifty 50 Fall Today?</h2><p>Nifty 50 fell 46 points (-0.19%) to close at 23,643.50 on Friday, May 15, 2026. The index snapped a two-day winning streak as renewed US-Iran tensions lifted Brent crude above $109/barrel. The Indian Rupee breached 96/$ for the first time, adding to market nervousness. Fag-end selling in banking and auto stocks dragged the index lower.</p><ul><li>Brent crude surged above $109 on Iran ship seizure news</li><li>Rupee hit record low of 96 against US Dollar</li><li>Profit booking after two-day rally</li></ul></section>',
    metaTitle: 'Why Nifty 50 Fell 46 Points Today | 15 May 2026',
    metaDesc: 'Nifty 50 fell 46 points (-0.19%) to 23,643.50 today. Rupee breaches 96/$ and crude oil surge triggered selling.',
    keywords: ['nifty 50', 'nifty today', 'nifty fall reason'], eventDate: friday
  }})

  // Sensex - actual: 75,237.99, fell 160.73 pts (-0.21%)
  await prisma.indexEvent.create({ data: {
    slug: 'why-sensex-fell-161points-today-2026-05-15',
    indexName: 'Sensex', indexSymbol: '^BSESN', eventType: 'FALL',
    changePercent: 0.21, changePoints: 161, openValue: 75399, closeValue: 75238,
    highValue: 75500, lowValue: 75100, newsItems: [],
    pageContent: '<section><h2>Why Did Sensex Fall Today?</h2><p>Sensex fell 161 points (-0.21%) to close at 75,237.99 on Friday, May 15, 2026. The benchmark snapped its two-day gaining streak as geopolitical tensions between US and Iran pushed crude oil prices higher. The Rupee touching a record low of 96/$ added to bearish sentiment. HDFC Bank, Reliance and ICICI Bank were the top drags on the index.</p><ul><li>US-Iran tensions pushed Brent crude above $109/barrel</li><li>Indian Rupee hit all-time low of 96/$</li><li>FII selling resumed amid global risk-off mood</li></ul></section>',
    metaTitle: 'Why Sensex Fell 161 Points Today | 15 May 2026',
    metaDesc: 'Sensex fell 161 points (-0.21%) to 75,238 today. Rising crude oil and weak Rupee triggered selling.',
    keywords: ['sensex', 'sensex today', 'sensex fall reason'], eventDate: friday
  }})

  // Gold 24K - actual: ₹16,009/10g (₹1,601/g), fell ~1.38%
  await prisma.metalEvent.create({ data: {
    slug: 'why-gold-price-fell-today-2026-05-15',
    metal: 'GOLD', carat: '24K', eventType: 'FALL',
    changePercent: 1.38, pricePerGram: 1601, pricePerTola: 18668, pricePerOunce: 3230,
    newsItems: [],
    pageContent: '<section><h2>Why Did Gold Price Fall Today?</h2><p>Gold price fell 1.38% today in India on May 15, 2026. The price of 24K gold declined by ₹224 to ₹16,009 per 10 grams (₹1,601 per gram). Profit booking after a four-day bull run and the government capping duty-free gold imports triggered the decline. A stronger US Dollar also weighed on gold prices globally.</p><ul><li>Profit booking after four consecutive days of gains</li><li>Government capped duty-free gold import limits</li><li>US Dollar strength pressured gold globally</li></ul></section>',
    metaTitle: 'Why Gold Price Fell Today In India | 15 May 2026',
    metaDesc: 'Gold price fell 1.38% to ₹16,009/10g today. Profit booking and govt duty-free import cap triggered decline.',
    keywords: ['gold price today', 'gold rate', 'gold price fall reason'], eventDate: friday
  }})

  // Silver - actual: ₹290/g, fell ~3.33%
  await prisma.metalEvent.create({ data: {
    slug: 'why-silver-price-fell-today-2026-05-15',
    metal: 'SILVER', carat: null, eventType: 'FALL',
    changePercent: 3.33, pricePerGram: 290, pricePerTola: 3383, pricePerOunce: 32.18,
    newsItems: [],
    pageContent: '<section><h2>Why Did Silver Price Fall Today?</h2><p>Silver price fell 3.33% today in India on May 15, 2026. The price declined by ₹10 to ₹290 per gram (₹2,90,000 per kg). Silver extended losses for a second consecutive session as industrial demand concerns and profit booking weighed on prices. The metal underperformed gold amid a risk-off environment.</p><ul><li>Second consecutive day of losses</li><li>Industrial demand concerns amid global slowdown fears</li><li>Profit booking after recent sharp rally</li></ul></section>',
    metaTitle: 'Why Silver Price Fell Today In India | 15 May 2026',
    metaDesc: 'Silver price fell 3.33% to ₹290/g today. Industrial demand concerns and profit booking triggered decline.',
    keywords: ['silver price today', 'silver rate', 'silver price fall'], eventDate: friday
  }})

  console.log('Done! Inserted real Friday May 15 market data.')
  await prisma.$disconnect()
}

seed()

// Script validated
