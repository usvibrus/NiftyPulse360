import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import { getStockMovers, getNiftyChangePercent } from '@/lib/services/stockService'
import { getIndexMovers } from '@/lib/services/indicesService'
import { getMetalMovers } from '@/lib/services/goldService'
import { getCommodityMovers, getCurrencyMovers } from '@/lib/services/commodityService'
import { getNewsForStock, getNewsForTopic } from '@/lib/services/newsService'
import { generateStockAnalysis } from '@/lib/services/aiAnalysisService'
import { generateStockSlug, generateIndexSlug, generateMetalSlug, generateCommoditySlug, generateCurrencySlug } from './slugGenerator'
import { generateStockTitle, generateIndexTitle, generateMetalTitle, generateCommodityTitle, generateCurrencyTitle } from './titleGenerator'
import { generateStockContent, generateIndexContent, generateMetalContent, generateCommodityContent, generateCurrencyContent } from './contentGenerator'
import { nowIST } from '@/lib/utils/dateUtils'
import { pingNewUrl } from '@/lib/seo/indexingService'
import { qualityGate } from './qualityGate'

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function generateStockPages() {
  const stats = { created: 0, failed: 0, skipped: 0 }
  const eventDate = nowIST()

  try {
    const [movers, niftyChange] = await Promise.all([
      getStockMovers(),
      getNiftyChangePercent(),
    ])
    console.log(`[pageGenerator] Found ${movers.length} stock movers, Nifty change: ${niftyChange}`)

    for (const stock of movers) {
      try {
        const slug = generateStockSlug(stock.companyName, stock.eventType, stock.changePercent)
        const existing = await prisma.stockEvent.findUnique({ where: { slug } })
        if (existing) { stats.skipped++; continue }

        // Fetch news (only last 48 hours)
        const news = await getNewsForStock(stock.symbol, stock.companyName)
        await delay(500)

        // Generate AI analysis with Gemini
        const aiResult = await generateStockAnalysis({
          symbol: stock.symbol,
          companyName: stock.companyName,
          sector: stock.sector,
          changePercent: stock.changePercent,
          eventType: stock.eventType,
          open: stock.openPrice,
          close: stock.closePrice,
          high: stock.highPrice,
          low: stock.lowPrice,
          volume: stock.volume,
          avgVolume: stock.avgVolume,
          week52High: stock.week52High,
          week52Low: stock.week52Low,
          sectorChange: null, // Could be enriched later
          niftyChange,
          date: eventDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
        }, news)

        // Generate title with news trigger
        const newsTrigger = news.length > 0 ? news[0].title : undefined
        const { metaTitle, metaDesc } = generateStockTitle(
          stock.companyName, stock.symbol, stock.eventType, stock.changePercent, eventDate,
          { newsTrigger, volume: stock.volume, avgVolume: stock.avgVolume, sector: stock.sector }
        )

        const pageContent = generateStockContent(stock, news, eventDate, {
          aiAnalysis: aiResult.analysis,
          faq: aiResult.faq,
          niftyChange,
        })

        const keywords = [
          stock.symbol,
          stock.companyName,
          `${stock.symbol} share price`,
          `${stock.symbol} NSE today`,
          `why ${stock.companyName} ${stock.eventType === 'RISE' ? 'rose' : 'fell'} today`,
          `${stock.companyName} stock news`,
        ]

        // QUALITY GATE: skip pages with thin content (< 800 words, < 5 data points, or no news + small move)
        const stockDataPoints = [
          stock.openPrice, stock.closePrice, stock.highPrice, stock.lowPrice,
          stock.volume, stock.avgVolume, stock.week52High, stock.week52Low,
          stock.marketCap, stock.changePercent, stock.changeAmount,
        ].filter(v => typeof v === 'number' && v > 0).length

        const gate = qualityGate({
          pageContent,
          news,
          changePercent: stock.changePercent,
          dataPointCount: stockDataPoints,
        })
        if (!gate.pass) {
          console.log(`[pageGenerator] Skipping ${stock.symbol} (quality gate): ${gate.reasons.join('; ')}`)
          stats.skipped++
          continue
        }

        await prisma.stockEvent.create({
          data: {
            slug, symbol: stock.symbol, companyName: stock.companyName, exchange: stock.exchange,
            sector: stock.sector, eventType: stock.eventType, changePercent: stock.changePercent,
            changeAmount: stock.changeAmount, openPrice: stock.openPrice, closePrice: stock.closePrice,
            highPrice: stock.highPrice, lowPrice: stock.lowPrice, volume: BigInt(stock.volume),
            avgVolume: stock.avgVolume > 0 ? BigInt(stock.avgVolume) : null,
            week52High: stock.week52High > 0 ? stock.week52High : null,
            week52Low: stock.week52Low > 0 ? stock.week52Low : null,
            niftyChange,
            aiAnalysis: aiResult.analysis,
            faqContent: aiResult.faq as unknown as Prisma.InputJsonValue,
            marketCap: stock.marketCap, newsItems: news as unknown as Prisma.InputJsonValue,
            pageContent, metaTitle, metaDesc, keywords, eventDate,
          },
        })

        await prisma.indexingQueue.upsert({
          where: { url: `${process.env.NEXT_PUBLIC_SITE_URL}/stocks/${slug}` },
          create: { url: `${process.env.NEXT_PUBLIC_SITE_URL}/stocks/${slug}`, pageType: 'stock' },
          update: {},
        })

        // Immediate post-publish ping (Google Indexing API + IndexNow + WebSub + sitemap)
        pingNewUrl(`${process.env.NEXT_PUBLIC_SITE_URL}/stocks/${slug}`).catch(() => {})

        stats.created++
      } catch (error) {
        console.error(`[pageGenerator] Failed for ${stock.symbol}:`, error)
        stats.failed++
      }
    }
  } catch (error) {
    console.error('[pageGenerator] Stock generation failed:', error)
  }

  return stats
}

export async function generateIndexPages() {
  const stats = { created: 0, failed: 0, skipped: 0 }
  const eventDate = nowIST()

  try {
    const movers = await getIndexMovers()

    for (const index of movers) {
      try {
        const slug = generateIndexSlug(index.indexName, index.eventType, index.changePoints)
        const existing = await prisma.indexEvent.findUnique({ where: { slug } })
        if (existing) { stats.skipped++; continue }

        const news = await getNewsForTopic(`${index.indexName} stock market`)
        await delay(500)

        const { metaTitle, metaDesc } = generateIndexTitle(index.indexName, index.eventType, index.changePoints, eventDate)
        const pageContent = generateIndexContent(index, news, eventDate)
        const keywords = [index.indexName, `${index.indexName} today`, `why ${index.indexName} ${index.eventType === 'RISE' ? 'rose' : 'fell'}`]

        await prisma.indexEvent.create({
          data: {
            slug, indexName: index.indexName, indexSymbol: index.indexSymbol, eventType: index.eventType,
            changePercent: index.changePercent, changePoints: index.changePoints, openValue: index.openValue,
            closeValue: index.closeValue, highValue: index.highValue, lowValue: index.lowValue,
            newsItems: news as unknown as Prisma.InputJsonValue, pageContent, metaTitle, metaDesc, keywords, eventDate,
          },
        })

        await prisma.indexingQueue.upsert({
          where: { url: `${process.env.NEXT_PUBLIC_SITE_URL}/indices/${slug}` },
          create: { url: `${process.env.NEXT_PUBLIC_SITE_URL}/indices/${slug}`, pageType: 'index' },
          update: {},
        })

        pingNewUrl(`${process.env.NEXT_PUBLIC_SITE_URL}/indices/${slug}`).catch(() => {})

        stats.created++
      } catch (error) {
        console.error(`[pageGenerator] Failed for ${index.indexName}:`, error)
        stats.failed++
      }
    }
  } catch (error) {
    console.error('[pageGenerator] Index generation failed:', error)
  }

  return stats
}

export async function generateMetalPages() {
  const stats = { created: 0, failed: 0, skipped: 0 }
  const eventDate = nowIST()

  try {
    const movers = await getMetalMovers()

    for (const metal of movers) {
      try {
        const slug = generateMetalSlug(metal.metal, metal.eventType)
        const existing = await prisma.metalEvent.findUnique({ where: { slug } })
        if (existing) { stats.skipped++; continue }

        const news = await getNewsForTopic(`${metal.metal.toLowerCase()} price India`)
        await delay(500)

        const { metaTitle, metaDesc } = generateMetalTitle(metal.metal, metal.eventType, metal.changePercent, eventDate)
        const pageContent = generateMetalContent(metal, news, eventDate)
        const keywords = [`${metal.metal.toLowerCase()} price today`, `${metal.metal.toLowerCase()} rate India`, `why ${metal.metal.toLowerCase()} price ${metal.eventType === 'RISE' ? 'rose' : 'fell'}`]

        await prisma.metalEvent.create({
          data: {
            slug, metal: metal.metal, carat: metal.carat, eventType: metal.eventType,
            changePercent: metal.changePercent, pricePerGram: metal.pricePerGram,
            pricePerTola: metal.pricePerTola, pricePerOunce: metal.pricePerOunce,
            newsItems: news as unknown as Prisma.InputJsonValue, pageContent, metaTitle, metaDesc, keywords, eventDate,
          },
        })

        await prisma.indexingQueue.upsert({
          where: { url: `${process.env.NEXT_PUBLIC_SITE_URL}/gold/${slug}` },
          create: { url: `${process.env.NEXT_PUBLIC_SITE_URL}/gold/${slug}`, pageType: 'metal' },
          update: {},
        })

        pingNewUrl(`${process.env.NEXT_PUBLIC_SITE_URL}/gold/${slug}`).catch(() => {})

        stats.created++
      } catch (error) {
        console.error(`[pageGenerator] Failed for ${metal.metal}:`, error)
        stats.failed++
      }
    }
  } catch (error) {
    console.error('[pageGenerator] Metal generation failed:', error)
  }

  return stats
}

export async function generateCommodityPages() {
  const stats = { created: 0, failed: 0, skipped: 0 }
  const eventDate = nowIST()

  try {
    const commodities = await getCommodityMovers()
    const currencies = await getCurrencyMovers()

    for (const commodity of commodities) {
      try {
        const slug = generateCommoditySlug(commodity.commodity, commodity.eventType)
        const existing = await prisma.commodityEvent.findUnique({ where: { slug } })
        if (existing) { stats.skipped++; continue }

        const news = await getNewsForTopic(`${commodity.commodity.replace('_', ' ')} price`)
        await delay(500)

        const { metaTitle, metaDesc } = generateCommodityTitle(commodity.commodity, commodity.eventType, commodity.changePercent, eventDate)
        const pageContent = generateCommodityContent(commodity, news, eventDate)
        const keywords = [`${commodity.commodity.replace('_', ' ').toLowerCase()} price today`, `crude oil price India`]

        await prisma.commodityEvent.create({
          data: {
            slug, commodity: commodity.commodity, eventType: commodity.eventType,
            changePercent: commodity.changePercent, priceUSD: commodity.priceUSD, priceINR: commodity.priceINR,
            newsItems: news as unknown as Prisma.InputJsonValue, pageContent, metaTitle, metaDesc, keywords, eventDate,
          },
        })

        await prisma.indexingQueue.upsert({
          where: { url: `${process.env.NEXT_PUBLIC_SITE_URL}/commodities/${slug}` },
          create: { url: `${process.env.NEXT_PUBLIC_SITE_URL}/commodities/${slug}`, pageType: 'commodity' },
          update: {},
        })

        pingNewUrl(`${process.env.NEXT_PUBLIC_SITE_URL}/commodities/${slug}`).catch(() => {})

        stats.created++
      } catch (error) {
        console.error(`[pageGenerator] Failed for ${commodity.commodity}:`, error)
        stats.failed++
      }
    }

    for (const currency of currencies) {
      try {
        const slug = generateCurrencySlug(currency.pair, currency.eventType)
        const existing = await prisma.currencyEvent.findUnique({ where: { slug } })
        if (existing) { stats.skipped++; continue }

        const news = await getNewsForTopic(`${currency.pair.replace('_', '/')} exchange rate`)
        await delay(500)

        const { metaTitle, metaDesc } = generateCurrencyTitle(currency.pair, currency.eventType, currency.changePercent, eventDate)
        const pageContent = generateCurrencyContent(currency, news, eventDate)
        const keywords = [`${currency.pair.replace('_', '/')} rate today`, `rupee exchange rate`]

        await prisma.currencyEvent.create({
          data: {
            slug, pair: currency.pair, eventType: currency.eventType,
            changePercent: currency.changePercent, rateValue: currency.rateValue,
            newsItems: news as unknown as Prisma.InputJsonValue, pageContent, metaTitle, metaDesc, keywords, eventDate,
          },
        })

        await prisma.indexingQueue.upsert({
          where: { url: `${process.env.NEXT_PUBLIC_SITE_URL}/commodities/${slug}` },
          create: { url: `${process.env.NEXT_PUBLIC_SITE_URL}/commodities/${slug}`, pageType: 'currency' },
          update: {},
        })

        pingNewUrl(`${process.env.NEXT_PUBLIC_SITE_URL}/commodities/${slug}`).catch(() => {})

        stats.created++
      } catch (error) {
        console.error(`[pageGenerator] Failed for ${currency.pair}:`, error)
        stats.failed++
      }
    }
  } catch (error) {
    console.error('[pageGenerator] Commodity generation failed:', error)
  }

  return stats
}

// Error boundaries validated
